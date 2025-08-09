#!/usr/bin/env node

import crypto from 'crypto'
import { URLSearchParams } from 'url'
import { program } from 'commander'
import prompts from 'prompts'
import chalk from 'chalk'

// OAuth signature generation
function generateSignature(method, url, params, consumerSecret, tokenSecret = '') {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')

  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`
  
  return crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64')
}

function generateNonce() {
  return crypto.randomBytes(16).toString('hex')
}

function generateTimestamp() {
  return Math.floor(Date.now() / 1000).toString()
}

async function makeOAuthRequest(url, params) {
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
  
  const fullUrl = `${url}?${queryString}`
  
  try {
    const response = await fetch(fullUrl)
    const text = await response.text()
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`)
    }
    
    // Parse URL-encoded response
    const parsed = {}
    new URLSearchParams(text).forEach((value, key) => {
      parsed[key] = value
    })
    
    return parsed
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`)
  }
}

async function getRequestToken(consumerKey, consumerSecret) {
  console.log(chalk.blue('🔑 Step 1: Getting request token...'))
  
  const params = {
    oauth_callback: 'oob',
    oauth_consumer_key: consumerKey,
    oauth_nonce: generateNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: generateTimestamp(),
    oauth_version: '1.0'
  }
  
  const signature = generateSignature(
    'GET',
    'https://www.flickr.com/services/oauth/request_token',
    params,
    consumerSecret
  )
  
  params.oauth_signature = signature
  
  try {
    const response = await makeOAuthRequest(
      'https://www.flickr.com/services/oauth/request_token',
      params
    )
    
    if (!response.oauth_token || !response.oauth_token_secret) {
      throw new Error('Invalid response from Flickr')
    }
    
    console.log(chalk.green('✅ Request token obtained successfully!'))
    return {
      token: response.oauth_token,
      tokenSecret: response.oauth_token_secret
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to get request token:'), error.message)
    process.exit(1)
  }
}

async function getAccessToken(consumerKey, consumerSecret, requestToken, requestTokenSecret, verifier) {
  console.log(chalk.blue('🔑 Step 3: Exchanging request token for access token...'))
  
  const params = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: generateNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: generateTimestamp(),
    oauth_token: requestToken,
    oauth_verifier: verifier,
    oauth_version: '1.0'
  }
  
  const signature = generateSignature(
    'GET',
    'https://www.flickr.com/services/oauth/access_token',
    params,
    consumerSecret,
    requestTokenSecret
  )
  
  params.oauth_signature = signature
  
  try {
    const response = await makeOAuthRequest(
      'https://www.flickr.com/services/oauth/access_token',
      params
    )
    
    if (!response.oauth_token || !response.oauth_token_secret) {
      throw new Error('Invalid response from Flickr')
    }
    
    console.log(chalk.green('✅ Access token obtained successfully!'))
    console.log(chalk.cyan('📝 User info:'))
    console.log(`   Username: ${chalk.white(response.username)}`)
    console.log(`   Full name: ${chalk.white(decodeURIComponent(response.fullname || 'N/A'))}`)
    console.log(`   User ID: ${chalk.white(response.user_nsid)}`)
    
    return {
      token: response.oauth_token,
      tokenSecret: response.oauth_token_secret,
      username: response.username,
      fullname: response.fullname,
      userNsid: response.user_nsid
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to get access token:'), error.message)
    process.exit(1)
  }
}

async function main() {
  // Configure CLI
  program
    .name('generate-flickr-oauth')
    .description('Generate Flickr OAuth tokens for API access')
    .version('1.0.0')
    .option('-k, --key <key>', 'Flickr API key (consumer key)')
    .option('-s, --secret <secret>', 'Flickr API secret (consumer secret)')
    .option('--no-interactive', 'Run in non-interactive mode (requires all options)')
    .parse()

  const options = program.opts()
  
  console.log(chalk.bold.blue('🚀 Flickr OAuth Token Generator'))
  console.log(chalk.gray('=' + '='.repeat(32)))
  console.log()

  // Get credentials from args or env vars or prompts
  let consumerKey = options.key || process.env.FLICKR_API_KEY
  let consumerSecret = options.secret || process.env.FLICKR_API_SECRET

  if (!consumerKey || !consumerSecret) {
    if (!options.interactive) {
      console.error(chalk.red('❌ Error: API credentials required'))
      console.log('Either set FLICKR_API_KEY and FLICKR_API_SECRET environment variables,')
      console.log('or provide them as arguments: --key <key> --secret <secret>')
      process.exit(1)
    }

    console.log(chalk.yellow('🔧 API credentials not found in environment variables'))
    console.log('You can get these from: https://www.flickr.com/services/apps/')
    console.log()

    const credentialPrompts = []
    
    if (!consumerKey) {
      credentialPrompts.push({
        type: 'text',
        name: 'consumerKey',
        message: 'Enter your Flickr API Key (Consumer Key):',
        validate: value => value.trim() ? true : 'API Key is required'
      })
    }
    
    if (!consumerSecret) {
      credentialPrompts.push({
        type: 'password',
        name: 'consumerSecret',
        message: 'Enter your Flickr API Secret (Consumer Secret):',
        validate: value => value.trim() ? true : 'API Secret is required'
      })
    }

    if (credentialPrompts.length > 0) {
      const credentials = await prompts(credentialPrompts, {
        onCancel: () => {
          console.log(chalk.yellow('\n👋 OAuth setup cancelled'))
          process.exit(0)
        }
      })
      
      consumerKey = consumerKey || credentials.consumerKey
      consumerSecret = consumerSecret || credentials.consumerSecret
    }
  }

  // Step 1: Get request token
  const requestToken = await getRequestToken(consumerKey, consumerSecret)
  
  // Step 2: User authorization
  console.log()
  console.log(chalk.blue('👤 Step 2: User authorization required'))
  console.log(chalk.gray('=' + '='.repeat(37)))
  console.log('Please visit this URL in your browser to authorize the application:')
  console.log()
  console.log(chalk.underline.blue(`https://www.flickr.com/services/oauth/authorize?oauth_token=${requestToken.token}&perms=read`))
  console.log()
  console.log('After clicking ' + chalk.bold('"OK, I\'LL AUTHORIZE IT"') + ', you will see a verification code.')
  console.log()

  const verifierPrompt = await prompts({
    type: 'text',
    name: 'verifier',
    message: '📝 Enter the verification code:',
    validate: value => value.trim() ? true : 'Verification code is required'
  }, {
    onCancel: () => {
      console.log(chalk.yellow('\n👋 OAuth setup cancelled'))
      process.exit(0)
    }
  })

  // Step 3: Exchange for access token
  const accessToken = await getAccessToken(
    consumerKey, 
    consumerSecret, 
    requestToken.token, 
    requestToken.tokenSecret, 
    verifierPrompt.verifier
  )
  
  // Success output
  console.log()
  console.log(chalk.bold.green('🎉 SUCCESS!') + ' Add these to your .env file:')
  console.log(chalk.gray('=' + '='.repeat(47)))
  console.log(chalk.bold(`FLICKR_OAUTH_TOKEN=${accessToken.token}`))
  console.log(chalk.bold(`FLICKR_OAUTH_SECRET=${accessToken.tokenSecret}`))
  console.log(chalk.gray('=' + '='.repeat(47)))
  console.log()
  console.log('After adding these to your .env file, run:')
  console.log(chalk.cyan('npm run build'))
  console.log()
  console.log('to test your Flickr integration! 📸')
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('❌ Unexpected error:'), error.message)
  process.exit(1)
})

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n👋 OAuth setup cancelled'))
  process.exit(0)
})

main().catch((error) => {
  console.error(chalk.red('❌ Error:'), error.message)
  process.exit(1)
})