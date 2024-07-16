---
title: SolveSpace Fundamentals
date: 2024-07-15
categories: [Miscellany]
tags: [3D printing, making]
xposts:
  - label: Mastodon
    url: https://social.coop/@harris/112793369182414774
  - label: Facebook
    url: https://www.facebook.com/harrislap/posts/pfbid0QFhZex7u9UCWyVbuvYThQTFGy46tJRf9ccK5XwXk5LDjk8xmZT3k3DGDHfDG6Pipl
---

For most of my CAD I use [OpenSCAD][], a coding-language–based modeling environment that appeals to my programmer/mathematician brain. But when it gets tedious figuring out how to express visual shapes in code, I turn to [SolveSpace][] instead.[^1]

[^1]: It should be said that both of these are *unusual* in the 3D CAD world. They have their adherents, but most modelers use friendlier GUI CAD software like [Fusion 360][]. But both of these are more analytical/mathematical than drawing things freehand and, though they work quite differently, they tickle similar parts of my brain.

[OpenSCAD]: https://www.openscad.org/
[SolveSpace]: http://solvespace.com/index.pl
[Fusion 360]: https://www.autodesk.com/products/fusion-360/overview

I'm still fairly new to SolveSpace, and I like it quite a lot, but I haven't been fully satisfied by the way tutorials explain the theoretical foundation of how it works. They do have [very good tutorials](https://solvespace.com/tutorial.pl) that get you modeling hands-on. This is my attempt to complement those tutorials with a more analytical explanation of the underlying system, as well as a general review of using it.

## The Basic Process

SolveSpace is a GUI[^2] CAD program that is based, roughly, around this workflow:

[^2]: Graphical User Interface, as opposed to a text-based environment, like OpenSCAD.

1. Sketch 2D shapes in a "workplane"
2. Transform those 2D shapes into 3D objects by extruding them linearly, rotationally, or in a helix
3. Optionally, duplicate those objects by repeating in a line or rotationally around a point
4. Repeat the process to create additional components that you can combine together to create a final model

The heart of SolveSpace, though, is the constraints engine. When you are drawing in 2D or extruding in 3D you define the relationship of elements to each other with constraints. You start by drawing something freehand and then you add constraints to give it precision. Constraints can be things like:

* This line segment is 2 units long
* This arc is 20 degrees
* These line segments are parallel
* This point is at the midpoint of this line segment
* This arc has double the diameter of this circle

SolveSpace "solves" these constraints to produce an exact model that meets those specifications.

## Sketch 2D Shapes in a "Workplane"

That's a little abstract, so here's a concrete example. When you open a new SolveSpace document, it automatically creates an initial workplane for you. SolveSpace has a rectangle drawing tool, but the rectangle drawing tool is really a shortcut for drawing four lines with specific constraints pre-applied:

![A SolveSpace window depicting a rectangle overlaid on a set of coordinate axes.](/media/3d-cad-with-solvespace/rect.png)

A rectangle is actually made up of four **line segments** (represented in white) which each inherently have two **points** and come with eight automatically adopted **constraints** (represented in purple). The constraints are:

* **Vertical**: Represented by the purple `V`s, this constraint ensures that a line segment is vertical (parallel to the Y-axis of the workplane). It's applied to two sides of the rectangle.
* **Horizontal**: Represented by the purple `H`s, this constraint ensures that a line segment is horizontal (parallel to the X-axis of the workplane). It's applied to the other two sides of the rectangle.
* **On Point/Coincident**: This is the least obvious constraint. Each line segment naturally has two points, meaning there are actually *eight* points in this sketch. But each pair of them has the **on point** constraint applied which specifies that those two points must always be in the same place. These constraints are represented by the small purple dots inside of each green point.

Together these constraints create a rectangle. You can see all the objects in this workplane and all the constraints listed in the property inspector:

![The SolveSpace property inspector listing under "requests" four line segments and under "constraints" the eight constraints enumerated above.](/media/3d-cad-with-solvespace/rect-property-inspector.png)

Note that the property inspector refers to this sketch as a "**Group**." There's a number of different "Group" types in SolveSpace that can be thought of as layers or transformations acting on the layers beneath them. A sketch in a workplane is a group. An extrusion is a group. A step repeating (multiplying an object) is a group. Every group has a suite of settings and properties that can be modified in the inspector, as seen here.

As described above you can also see our four line segments (titled "Requests," I guess because we are requesting that SolveSpace draw them?) and our eight constraints. SolveSpace supports a number of constraint types, but here are the ones I commonly use:

* **Distance:** Numerically specifies the length of a line segment, the radius of a circle arc, or other similar measurements
* **Angle:** Numerically specifies the angle between two line segments or "normals" (e.g., axes)
* **Horizontal** and **Vertical:** See above
* **On Point / Curve / Plane:** Can specify that two points are coincident, or that a point must fall on a line, arc, or plane
* **Equal Length / Radius / Angle:** Specifies that two circles, arcs, angles, or line segments, are equal in magnitude
* **Length / Arc Ratio:** Similar to "Equal Length" above, but specifies that two measurements have a constant ratio between them (e.g., a line segment is always twice the length of another line segment)
* **Length / Arc Difference:** Similar to above, but specifies that two measurements have a consistent difference (e.g., a line segment is always two units longer than another line segment)
* **At Midpoint:** Specifies that a point falls at the exact midpoint of a line segment
* **Parallel / Tangent:** Specifies that a line segment is parallel to another line segment, or that a line segment is tangent to the endpoint of an arc (if they have coincident endpoints)
* **Perpindicular:** Just what it says on the tin.

SolveSpace's interface tries to infer intended constraints as you draw. If you start a line segment on an existing point, for example, it will automatically add an **on point** constraint to the existing point and the new one. If your line seems to be horizontal, it automatically adds the horizontal constraint. This produces a predictable drawing experience, but most other constraints have to be explicitly added.

You might note, with the eight constraints we have now, we can still move the rectangle around and resize it. SolveSpace lets us know this is the case in the inspector above by saying "**4 DOF**," i.e., **four degrees of freedom**. SolveSpace's interface gently nudges you toward reducing each group's DOF to zero, for some good reasons:

1. It's good be able to use drag-and-drop to do your initial sketches, but as your model takes form, you want to specify explicitly what its shape and dimensions are.
2. When the constraint solver is forced to resolve (which it is regularly – every time you drag a point to a new location) it attempts to solve in a way that is intuitive, but it doesn't always get it right. The fewer DOF you have, the less resolving it has to do.

I can reduce the degrees of freedom by constraining our rectangle to some specific dimensions, say, `75` by `50`.

![The same rectangle pictured above, but now dimensions are specified in purple numbers along the top and left edges.](/media/3d-cad-with-solvespace/rect-w-dimensions.png)

At this point the inspector will still report 2 DOF because I can still move the rectangle left/right and up/down. If I want to constrain its position, I can do so relative to the origin point of the workplane (pictured in green at the center). I can do this by adding an **on point** constraint between the origin and one of the corners:

![The same rectangle, but its top left point is now on the origin.](/media/3d-cad-with-solvespace/rect-on-point.png)

_Or_ if I want the rectangle centered, it's a little trickier, but one way to do it is with a **construction entity**. I can create a line segment going from one corner to the opposite, mark it as a construction entity (meaning it doesn't physically produce a part of the model, it's just used for constraint calculations). Then, if I specify that the origin must be the midpoint of the cross-line, the rectangle will be centered (note the M, representing the midpoint constraint):

![The same rectangle but with a green line crossing it diagonally and the origin at the midpoint of the green line, centering the rectangle on the origin.](/media/3d-cad-with-solvespace/rect-midpoint.png)

Okay, that's a lot of detail on *just* drawing in 2D, but that's where I spend most of my time in SolveSpace! And using just these basic entities and constraints, you can produce some pretty complex objects. I'm not going to go through creating it step by step, but, as an example to use for the next bit, here's the initial workplane for a compliant camera lens cap I modeled:

![2D sketch in solvespace of the bottom of a lens cap. Visible is a snaking 2D spring attached to a tab jutting out of a semicircle.](/media/3d-cad-with-solvespace/lenscap-wp.png)

## Transform 2D Shapes into 3D Objects

Taking this lens cap mechanism, the next thing I want to do is extrude it into a 3D object. I create a new **Extrude** group to make it 3D.

![The 2D sketch of a lens cap mechanism extruded linearly into a 3D object with flat edges](/media/3d-cad-with-solvespace/extruded.png)

Note that this is a two-sided extrusion around the initial workplane (which is on the XY plane) which is why you can also see the outline of the original drawing in the middle of it. An extrusion group naturally has one degree of freedom — how long the extrusion is. I limit this by selecting a vertical edge and setting its length to exactly `2`.

![The same extruded object but the left edge is labeled "2.00" in purple.](/media/3d-cad-with-solvespace/extruded-w-d-constraint.png)

My extrusion group now has zero degrees of freedom.

## Duplicate Objects

But I've only modeled *half* of the lens cap mechanism. A lens, after all, is not a semicircle. I need to duplicate it across the axis. Unfortunately SolveSpace doesn't have a reflection group, so instead I'm going to simulate it using the **step rotating** group, which duplicates the most recent around an axis. A step rotating group needs a point and "normal" to revolve around, so I select the origin and the Z-axis and create a new group. I tell it to repeat only twice (including the inital group).

![The same extruded object, but now repeated across the axis so it produces a full circular object.](/media/3d-cad-with-solvespace/repeat.png)

Once again, step rotating groups have one inherent degree of freedom – the angle of rotation. Even though this has produced the rotation I want, by default, I'd feel most comfortable if I formalize in a constraint that it should be 180°. There's a number of possible ways of doing this, but here's the one I choose: I select two points that are mirror opposites as well as the ZX plane and apply the **symmetric** constraint (oops I forgot to mention this one above!) to specify that those two points should be symmetrically positioned across the ZX plane.

![Zoomed in view of the center of the mechanism. Two points in the center have purple arrows pointing toward each other.](/media/3d-cad-with-solvespace/symmetric.png)

Note the small purple arrows in the center indicating the symmetric constraint. Now the step rotating group has zero degrees of freedom.

So, constraints are not limited to when you are sketching in a workplane. You can apply constraints in extrusion groups and repeating groups – and in fact that's how you define how different 3D components of your model relate to each other. _And_ importantly, constraints are not limited to the group that you're currently working in. You can apply constraints as relationships across groups. In this case I applied a constraint that is a relationship between a point in the step rotating group and a point in the extrusion group. The entities of any workplane or extrusion that precedes the current group can be referenced.

## Combining Components

Making a 2D object and extruding it prismatically is not a very interesting result, no matter how complex the initial 2D object. At this point, to complete the lens cap, I needed to create more components, starting from new workplanes, extruding them into 3D, and then defining how they interacted with the original part.

For example, I wanted to create a groove and tongue mechanism to keep the lens cap tabs vertically aligned when pressure is applied to them. I created new workplanes that were along the surfaces I wanted to place these components on, drew triangles, and then extruded them into 3 dimensions – in some cases creating extrusions in **assembly** mode (e.g., glue these components together) and in some cases **difference** mode (e.g., subtract this component from the solid model so far):


![A close up of the lens cap mechanism showing a tongue and groove for alignment along certain edges.](/media/3d-cad-with-solvespace/tongue-and-groove.png)

_I enabled stippled occluded lines so you can see with "x-ray" vision the tongue and groove._

For a more complex extrusion, to create the "teeth" that enable the tabs to grip on to the inner ring of a camera lens, I created a workplane perpindicular to the outer arc of the tabs, drew three triangles in a row, and then extruded them using a **revolve** group around the center of the arc.

![Close up of the edge of a tab on the lens cap showing three triangular grooves following the arc of the tab edge.](/media/3d-cad-with-solvespace/teeth.png)

You can use these mechanics together to create some pretty complex objects.

{% imagegrid %}

![A 3D lens cap modeled with its internal components showing in stippled lines.](/media/3d-cad-with-solvespace/fullcap.png)

![The property viewer showing all the groups of the lens cap.](/media/3d-cad-with-solvespace/fullcap-groups.png)

{% endimagegrid %}

{% stl '/media/3d-cad-with-solvespace/cap-58mm-lo.stl' %}

# The Pros and Cons

Having written several thousand word about it, it's probably pretty obvious that I like SolveSpace. But should *you* use it? Here's some pros and cons:

* **Pro:** Extremely satisfying if you're mathematically minding. Thinking in constraints comes as second nature to me.
* **Con:** The interface, as pictured, doesn't look like anything else on a computer and doesn't work like anything else on a computer, and can be pretty frustrating to get used to.
* **Pro:** It does look like something a 1337 h4xx0r might use, though, which makes me feel pretty cool.
* **Con:** It's really hard to get basic 3D modeling features like fillets and chamfers without a lot of extra work – and in some cases it's basically impossible. And because of the way SolveSpace's model works, I'm not sure [I expect this to change][chamfers] (though I'd like to see the option, when extruding, to add a chamfered top or bottom).
* **Pro:** Tons of keyboard shortcuts that make sketching pretty quick once you get the hang of it.
* **Con:** Even basic objects require a lot of complex groups that become pretty challenging to keep track of.
* **Con:** Sometimes the solver doesn't seem to work the way I expect? It will often tell me constraints are impossible to solve that I am pretty sure aren't (and then I just have to fiddle around dragging and dropping and adding and removing constraints until it works) or, more often, tell me I have redundant constraints (SolveSpace tries to encourage you to avoid redundant constraints as well as having too many DOF). Fortunately in the redundant constraint case you can toggle a switch on the group to allow redundant constraints, which I do frequently.
* **Con:** SolveSpace tries to resolve in ways that are intuitive to the editor, but sometimes it fails. I've often tried to pull two points apart only to watch them snap together instead! This can be particularly frustrating if the result is zero-length line segments, which I don't know how to get rid of besides deleting them and starting over or undoing and hoping it works.
* **Con:** Similarly, if you haven't fully constrained a group, edits in one place can cause unexpected results several groups up. I tried to make multiple versions of the lens cap at different diameters, but I've found that if I don't fully constrain the triangles that make up the tongue-and-groove mechanism, they have a tendency to invert whenever I change the diameter.
* **Con:** Undo is pretty buggy and flaky.
* **Pro:** Unlike triangular mesh modelers, SolveSpace can produce files that encode arcs in a pure form, leading to smaller files with higher resolution.
* **Con:** A lot of the time SolveSpace will produce surface errors trying to combine your multiple groups and you'll be forced to tick the box that forces triangular meshes instead ("Force NURBS surfaces to triangular mesh"). This has the additional side effect of *different* errors.
* **Con:** If you have a lot of groups, it can get really overwhelming looking at all of them at once.
* **Pro:** SolveSpace's ability to turn group visibility, certain types of entities, and occluded lines on-and-off can be pretty powerful. If I'm working on a workplane that has measurements based on only a couple preceding groups I can *just* enable those groups.
* **Pro:** The constraints system is super powerful.
* **Con:** It can be easy to lose track of what entities from earlier layers impact later constraints. SolveSpace tries to warn you when you're deleting an entity, but those warnings aren't super informative and it doesn't provide any warning or way of tracking if you're just *adjusting* an entity.

  ![An error message that reads "](/media/3d-cad-with-solvespace/constraint-warning.png)

[chamfers]: https://github.com/solvespace/solvespace/issues/149#issuecomment-739559115

Listen, it's a great system, it just comes with a lot of caveats.

P.S. The lens cap model is available [on Printables](https://www.printables.com/model/943512-lens-cap-print-in-place).

*[CAD]: computer-aided design
