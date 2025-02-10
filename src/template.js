export const pythonTemplate = `
import adsk.core, adsk.fusion, adsk.cam, traceback

# Function to check if an edge is an "outer" edge (on left or right side)
def is_outer_edge(edge, model_width):
    start_point = edge.startVertex.geometry
    end_point = edge.endVertex.geometry

    # Edge is outer if its X position is at 0 or model width
    return (abs(start_point.x - 0) < 0.001 and abs(end_point.x - 0) < 0.001) or \
           (abs(start_point.x - model_width) < 0.001 and abs(end_point.x - model_width) < 0.001)


def run(context):

    # Input parameters in cm
    input_model_width = {{input_model_width}}
    input_model_depth = {{input_model_depth}}
    input_model_fillet_radius = {{input_model_fillet_radius}}

    input_tier_1_extrusion_distance = {{input_tier_1_extrusion_distance}}
    input_row_1_hole_diameter = {{input_row_1_hole_diameter}}
    input_row_1_hole_horizontal_constraint = {{input_row_1_hole_horizontal_constraint}}
    input_row_1_hole_vertical_constraint = {{input_row_1_hole_vertical_constraint}}
    input_row_1_hole_height = {{input_row_1_hole_height}}
    input_row_1_rectangular_repeat_pattern_distance = {{input_row_1_rectangular_repeat_pattern_distance}}
    input_row_1_padding_left_right = {{input_row_1_padding_left_right}}
    input_row_1_padding_top_bottom = {{input_row_1_padding_top_bottom}}
    input_row_1_hole_shape = "{{input_row_1_hole_shape}}"


    input_tier_2_total_depth = {{input_tier_2_total_depth}}
    input_tier_2_extrusion_distance = {{input_tier_2_extrusion_distance}}
    input_row_2_hole_diameter = {{input_row_2_hole_diameter}}
    input_row_2_hole_horizontal_constraint = {{input_row_2_hole_horizontal_constraint}}
    input_row_2_hole_vertical_constraint = {{input_row_2_hole_vertical_constraint}}
    input_row_2_hole_height = {{input_row_2_hole_height}}
    input_row_2_rectangular_repeat_pattern_distance = {{input_row_2_rectangular_repeat_pattern_distance}}
    input_row_2_padding_left_right = {{input_row_2_padding_left_right}}
    input_row_2_padding_top_bottom = {{input_row_2_padding_top_bottom}}
    input_row_2_hole_shape = "{{input_row_2_hole_shape}}"

    input_tier_3_total_depth = {{input_tier_3_total_depth}}
    input_tier_3_extrusion_distance = {{input_tier_3_extrusion_distance}}
    input_row_3_hole_diameter = {{input_row_3_hole_diameter}}
    input_row_3_hole_horizontal_constraint = {{input_row_3_hole_horizontal_constraint}}
    input_row_3_hole_vertical_constraint = {{input_row_3_hole_vertical_constraint}}
    input_row_3_hole_height = {{input_row_3_hole_height}}
    input_row_3_rectangular_repeat_pattern_distance = {{input_row_3_rectangular_repeat_pattern_distance}}
    input_row_3_padding_left_right = {{input_row_3_padding_left_right}}
    input_row_3_padding_top_bottom = {{input_row_3_padding_top_bottom}}
    input_row_3_hole_shape = "{{input_row_3_hole_shape}}"

    ui = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface
        design = adsk.fusion.Design.cast(app.activeProduct)

        # Get the root component of the active design.
        rootComp = design.rootComponent

        # Get extrude features
        extrudes = rootComp.features.extrudeFeatures

        # Create a new sketch on the xy plane.
        # Before creating sketch
        sketches = rootComp.sketches
        xyPlane = rootComp.xYConstructionPlane
        transform = adsk.core.Matrix3D.create()
        transform.translation = adsk.core.Vector3D.create(0, 0, 0)
        xyPlane.transform = transform

        sketch = sketches.add(xyPlane)
        sketchLines = sketch.sketchCurves.sketchLines

        # Create a 120mm x 81mm rectangle
        startPoint = adsk.core.Point3D.create(0, 0, 0)
        endPoint = adsk.core.Point3D.create(input_model_width, input_model_depth, 0)
        sketchLines.addTwoPointRectangle(startPoint, endPoint)

        # Extrude the rectangle
        base_profile1 = sketch.profiles.item(0)
        extrusion_distance1 = adsk.core.ValueInput.createByReal(input_tier_1_extrusion_distance)
        extrude1 = extrudes.addSimple(base_profile1, extrusion_distance1,
                                      adsk.fusion.FeatureOperations.NewBodyFeatureOperation)

        # Get the extrusion body
        body1 = extrude1.bodies.item(0)
        body1.name = "simple"

        # Create a Center Diameter Circle on the top of body1 with constraints
        # Get top xy face of body1
        top_face = body1.faces.item(4)  # This is the top face of the rectangle body
        top_sketch = sketches.add(top_face)

        # Project edges into new sketch (important for constraints)
        edges = top_face.edges
        for edge in edges:
            top_sketch.project(edge)

        # Get projected edges (left and bottom edges of tier 1 rectangle base)
        projected_edges = top_sketch.sketchCurves.sketchLines
        # Add after projecting edges
        for i in range(projected_edges.count):
            edge = projected_edges.item(i)
            start = edge.startSketchPoint.geometry
            end = edge.endSketchPoint.geometry

            # Identify bottom edge (constant y at 0)
            if abs(start.y - 0) < 0.001 and abs(end.y - 0) < 0.001:
                bottom_edge = edge
            # Identify left edge (constant x at 0)
            if abs(start.x - 0) < 0.001 and abs(end.x - 0) < 0.001:
                left_edge = edge

        if input_row_1_hole_shape.lower() == "circle":
            # Create circle
            circles = top_sketch.sketchCurves.sketchCircles
            circle_center = adsk.core.Point3D.create(1, 1, 0)  # Adjust Z to match extrusion height
            circle = circles.addByCenterRadius(circle_center, input_row_1_hole_diameter / 2)

            # Add distance constraints
            dimensions = top_sketch.sketchDimensions

            # Position constraints
            horizontal_dim = dimensions.addOffsetDimension(
                left_edge,
                circle.centerSketchPoint,
                adsk.core.Point3D.create(circle_center.x / 2, circle_center.y, circle_center.z),
                True
            )
            horizontal_dim.parameter.expression = str(input_row_1_hole_horizontal_constraint * 10)

            vertical_dim = dimensions.addOffsetDimension(
                bottom_edge,
                circle.centerSketchPoint,
                adsk.core.Point3D.create(circle_center.x, circle_center.y / 2, circle_center.z),
                True
            )
            vertical_dim.parameter.expression = str(input_row_1_hole_vertical_constraint * 10)

            # For diameter dimension
            diameter_dim = dimensions.addDiameterDimension(
                circle,
                adsk.core.Point3D.create(circle_center.x + 0.5, circle_center.y + 0.75, circle_center.z),
                # Adjusted text position
                True
            )
            diameter_dim.parameter.expression = str(input_row_1_hole_diameter * 10)

        elif input_row_1_hole_shape.lower() == "square":
            # Create a rectangular hole (square)
            startPoint = adsk.core.Point3D.create(input_row_1_padding_left_right, input_row_1_padding_top_bottom + input_row_1_hole_diameter, 0)
            endPoint = adsk.core.Point3D.create(input_row_1_padding_left_right + input_row_1_hole_diameter, input_row_1_padding_top_bottom, 0)
            rectangle_lines = top_sketch.sketchCurves.sketchLines.addTwoPointRectangle(startPoint, endPoint)

        # Extrude row 1 hole
        row_1_hole_profile = top_sketch.profiles.item(1)
        row_1_hole_extrusion_distance = adsk.core.ValueInput.createByReal(-1 * input_row_1_hole_height)
        row_1_hole_extrusion = extrudes.addSimple(row_1_hole_profile, row_1_hole_extrusion_distance,
                                      adsk.fusion.FeatureOperations.CutFeatureOperation)

        # Repeat extrusion pattern for row 1 hole
        patterns = rootComp.features.rectangularPatternFeatures

        # Input for rectangular pattern
        features = adsk.core.ObjectCollection.create()
        features.add(row_1_hole_extrusion)  # Add the cut extrusion feature

        # Create distance for spacing between instances
        quantity = adsk.core.ValueInput.createByReal(5)
        distance = adsk.core.ValueInput.createByReal(input_row_1_rectangular_repeat_pattern_distance)

        # Create pattern input
        patternInput = patterns.createInput(
            features,
            bottom_edge,
            quantity,
            distance,
            adsk.fusion.PatternDistanceType.ExtentPatternDistanceType
        )

        # Create the pattern
        pattern = patterns.add(patternInput)



        #####################
        # Row 2
        #####################

        # Create row 2 rectangle
        upper_sketch = sketches.add(top_face)
        upper_sketch_lines = upper_sketch.sketchCurves.sketchLines
        start_point = adsk.core.Point3D.create(0, input_model_depth, 0)
        end_point = adsk.core.Point3D.create(input_model_width, input_model_depth - input_tier_2_total_depth,
                                             0)
        upper_sketch_lines.addTwoPointRectangle(start_point, end_point)

        # Find the profile that is the rectangle we just drew
        # for i in range(upper_sketch.profiles.count):
        #     area = upper_sketch.profiles.item(i).areaProperties().area
        #     ui.messageBox(f"Profile {i} area: {area}")

        # Extrude the rectangle
        upper_profile = upper_sketch.profiles.item(5)
        upper_extrusion_distance = adsk.core.ValueInput.createByReal(input_tier_2_extrusion_distance)
        upper_extrude = extrudes.addSimple(
            upper_profile,
            upper_extrusion_distance,
            adsk.fusion.FeatureOperations.JoinFeatureOperation)

        # Find top face of row 2
        # for i in range(body1.faces.count):
        #     face = body1.faces.item(i)
        #     point = face.geometry.origin
        #     ui.messageBox(f"Face {i} - Normal Z: {face.geometry.normal.z}, Position Z: {point.z}")

        # Get top face of row 2
        row_2_top_face = body1.faces.item(1)  # Adjust index based on debug output
        row_2_sketch = sketches.add(row_2_top_face)

        # Project edges
        upper_edges = row_2_top_face.edges
        for edge in upper_edges:
            row_2_sketch.project(edge)

        # Row 2 projected edges for constraints
        upper_circle_projected_edges = row_2_sketch.sketchCurves.sketchLines

        # Identify edges for constraints
        for i in range(upper_circle_projected_edges.count):
            edge = upper_circle_projected_edges.item(i)
            start = edge.startSketchPoint.geometry
            end = edge.endSketchPoint.geometry

            if abs(start.y - (input_model_depth - input_tier_2_total_depth)) < 0.001 and abs(
                    end.y - (input_model_depth - input_tier_2_total_depth)) < 0.001:
                upper_bottom_edge = edge
            if abs(start.x - 0) < 0.001 and abs(end.x - 0) < 0.001:
                upper_left_edge = edge

        # After edge identification, add debug output
        # ui.messageBox(f"Upper bottom edge - Start: ({upper_bottom_edge.startSketchPoint.geometry.x}, {upper_bottom_edge.startSketchPoint.geometry.y}), End: ({upper_bottom_edge.endSketchPoint.geometry.x}, {upper_bottom_edge.endSketchPoint.geometry.y})")
        # ui.messageBox(f"Upper left edge - Start: ({upper_left_edge.startSketchPoint.geometry.x}, {upper_left_edge.startSketchPoint.geometry.y}), End: ({upper_left_edge.endSketchPoint.geometry.x}, {upper_left_edge.endSketchPoint.geometry.y})")

        if input_row_2_hole_shape.lower() == "circle":
            # Create circle
            upper_circles = row_2_sketch.sketchCurves.sketchCircles
            upper_circle_center = adsk.core.Point3D.create(1.3, 4, 0)
            upper_circle = upper_circles.addByCenterRadius(upper_circle_center, input_row_2_hole_diameter / 2)

            # Add constraints
            upper_dimensions = row_2_sketch.sketchDimensions

            horizontal_dim = upper_dimensions.addOffsetDimension(
                upper_left_edge,
                upper_circle.centerSketchPoint,
                adsk.core.Point3D.create(upper_circle_center.x / 2, upper_circle_center.y, upper_circle_center.z),
                True
            )
            horizontal_dim.parameter.expression = str(input_row_2_hole_horizontal_constraint * 10)

            vertical_dim = upper_dimensions.addOffsetDimension(
                upper_bottom_edge,
                upper_circle.centerSketchPoint,
                adsk.core.Point3D.create(upper_circle_center.x, upper_circle_center.y / 2, upper_circle_center.z),
                True
            )
            vertical_dim.parameter.expression = str(input_row_2_hole_vertical_constraint * 10)

            diameter_dim = upper_dimensions.addDiameterDimension(
                upper_circle,
                adsk.core.Point3D.create(upper_circle_center.x + 0.5, upper_circle_center.y + 0.75,
                                         upper_circle_center.z),
                True
            )
            diameter_dim.parameter.expression = str(input_row_2_hole_diameter * 10)

        elif input_row_2_hole_shape.lower() == "square":

            # Create a rectangular hole (square)
            start_point_x = input_row_2_padding_left_right
            start_point_y = input_model_depth - input_tier_2_total_depth + input_row_2_padding_top_bottom + input_row_2_hole_diameter
            startPoint = adsk.core.Point3D.create(start_point_x, start_point_y, 0)

            end_point_x = input_row_2_padding_left_right + input_row_2_hole_diameter
            end_point_y = input_model_depth - input_tier_2_total_depth + input_row_2_padding_top_bottom
            endPoint = adsk.core.Point3D.create(end_point_x, end_point_y, 0)
            rectangle_lines = row_2_sketch.sketchCurves.sketchLines.addTwoPointRectangle(startPoint, endPoint)

        # Extrude row 2 hole
        row_2_hole_profile = row_2_sketch.profiles.item(1)
        row_2_hole_extrusion_distance = adsk.core.ValueInput.createByReal(-1 * input_row_2_hole_height)
        row_2_hole_extrusion = extrudes.addSimple(row_2_hole_profile, row_2_hole_extrusion_distance,
                                                  adsk.fusion.FeatureOperations.CutFeatureOperation)

        # Repeat extrusion pattern for row 2 holes
        patterns = rootComp.features.rectangularPatternFeatures

        # Input for rectangular pattern
        features = adsk.core.ObjectCollection.create()
        features.add(row_2_hole_extrusion)  # Add the cut extrusion feature

        # Create distance for spacing between instances
        quantity = adsk.core.ValueInput.createByReal(5)
        distance = adsk.core.ValueInput.createByReal(input_row_2_rectangular_repeat_pattern_distance)

        # Create pattern input
        patternInput = patterns.createInput(
            features,
            upper_bottom_edge,
            quantity,
            distance,
            adsk.fusion.PatternDistanceType.ExtentPatternDistanceType
        )

        # Create the pattern
        pattern = patterns.add(patternInput)

        #####################
        # Row 3
        #####################

        # Create row 3 rectangle
        row_3_sketch = sketches.add(row_2_top_face)
        row_3_sketch_lines = row_3_sketch.sketchCurves.sketchLines
        row_3_start = adsk.core.Point3D.create(0, input_model_depth, 0)
        row_3_end = adsk.core.Point3D.create(input_model_width, input_model_depth - input_tier_3_total_depth, 0)
        row_3_sketch_lines.addTwoPointRectangle(row_3_start, row_3_end)

        # Extrude row 3 rectangle
        row_3_profile = row_3_sketch.profiles.item(5)
        row_3_extrusion_distance = adsk.core.ValueInput.createByReal(input_tier_3_extrusion_distance)
        row_3_extrusion = extrudes.addSimple(
            row_3_profile,
            row_3_extrusion_distance,
            adsk.fusion.FeatureOperations.JoinFeatureOperation
        )


        # Project edges
        row_3_top_face = body1.faces.item(1)  # Update index from debug
        row_3_sketch = sketches.add(row_3_top_face)
        row_3_edges = row_3_top_face.edges
        for edge in row_3_edges:
            row_3_sketch.project(edge)

        # Identify edges
        row_3_projected_edges = row_3_sketch.sketchCurves.sketchLines
        for i in range(row_3_projected_edges.count):
            edge = row_3_projected_edges.item(i)
            start = edge.startSketchPoint.geometry
            end = edge.endSketchPoint.geometry

            if abs(start.y - (input_model_depth - input_tier_3_total_depth)) < 0.001 and abs(
                    end.y - (input_model_depth - input_tier_3_total_depth)) < 0.001:
                row_3_bottom_edge = edge
            if abs(start.x - 0) < 0.001 and abs(end.x - 0) < 0.001:
                row_3_left_edge = edge

        # # Debug edge identification
        # ui.messageBox(f"Second tier bottom edge - Start: ({second_tier_bottom_edge.startSketchPoint.geometry.x}, {second_tier_bottom_edge.startSketchPoint.geometry.y}), End: ({second_tier_bottom_edge.endSketchPoint.geometry.x}, {second_tier_bottom_edge.endSketchPoint.geometry.y})")
        # ui.messageBox(f"Second tier left edge - Start: ({second_tier_left_edge.startSketchPoint.geometry.x}, {second_tier_left_edge.startSketchPoint.geometry.y}), End: ({second_tier_left_edge.endSketchPoint.geometry.x}, {second_tier_left_edge.endSketchPoint.geometry.y})")



        if input_row_3_hole_shape.lower() == "circle":

            # Create circle
            row_3_circles = row_3_sketch.sketchCurves.sketchCircles
            row_3_circle_center = adsk.core.Point3D.create(1.3, 6.8, 0)
            row_3_circle = row_3_circles.addByCenterRadius(row_3_circle_center, input_row_3_hole_diameter / 2)

            # Add constraints
            row_3_dimensions = row_3_sketch.sketchDimensions

            row_3_horizontal_dim = row_3_dimensions.addOffsetDimension(
                row_3_left_edge,
                row_3_circle.centerSketchPoint,
                adsk.core.Point3D.create(row_3_circle_center.x / 2, row_3_circle_center.y,
                                         row_3_circle_center.z),
                True
            )
            row_3_horizontal_dim.parameter.expression = str(input_row_3_hole_horizontal_constraint * 10)

            row_3_vertical_dim = row_3_dimensions.addOffsetDimension(
                row_3_bottom_edge,
                row_3_circle.centerSketchPoint,
                adsk.core.Point3D.create(row_3_circle_center.x, row_3_circle_center.y / 2,
                                         row_3_circle_center.z),
                True
            )
            row_3_vertical_dim.parameter.expression = str(input_row_3_hole_vertical_constraint * 10)

            row_3_diameter_dim = row_3_dimensions.addDiameterDimension(
                row_3_circle,
                adsk.core.Point3D.create(row_3_circle_center.x + 0.5, row_3_circle_center.y + 0.75,
                                         row_3_circle_center.z),
                True
            )
            row_3_diameter_dim.parameter.expression = str(input_row_3_hole_diameter * 10)

        elif input_row_3_hole_shape.lower() == "square":

            # Create a square hole
            start_point_x = input_row_3_padding_left_right
            start_point_y = input_model_depth - input_tier_3_total_depth + input_row_3_padding_top_bottom + input_row_3_hole_diameter
            startPoint = adsk.core.Point3D.create(start_point_x, start_point_y, 0)

            end_point_x = input_row_3_padding_left_right + input_row_3_hole_diameter
            end_point_y = input_model_depth - input_tier_3_total_depth + input_row_3_padding_top_bottom
            endPoint = adsk.core.Point3D.create(end_point_x, end_point_y, 0)
            rectangle_lines = row_3_sketch.sketchCurves.sketchLines.addTwoPointRectangle(startPoint, endPoint)


        # Extrude row 3 hole
        row_3_hole_profile = row_3_sketch.profiles.item(1)
        row_3_hole_extrusion_distance = adsk.core.ValueInput.createByReal(-1 * input_row_3_hole_height)
        row_3_hole_extrusion = extrudes.addSimple(row_3_hole_profile, row_3_hole_extrusion_distance,
                                                  adsk.fusion.FeatureOperations.CutFeatureOperation)



        # Repeat extrusion pattern for row 3 holes
        patterns = rootComp.features.rectangularPatternFeatures

        # Input for rectangular pattern
        features = adsk.core.ObjectCollection.create()
        features.add(row_3_hole_extrusion)  # Add the cut extrusion feature

        # Create distance for spacing between instances
        quantity = adsk.core.ValueInput.createByReal(5)
        distance = adsk.core.ValueInput.createByReal(input_row_3_rectangular_repeat_pattern_distance)

        # Create pattern input
        patternInput = patterns.createInput(
            features,
            row_3_bottom_edge,
            quantity,
            distance,
            adsk.fusion.PatternDistanceType.ExtentPatternDistanceType
        )

        # Create the pattern
        pattern = patterns.add(patternInput)


        # Debug edges to identify chamfer edges

        # 10, 13, 31, 32 = L 1.9 (tier 2, tier 3 short vertical edge?)
        # 49, 53 = L 8.1 (back long vertical edge?)
        # for i in range(body1.edges.count):
        #     edge = body1.edges.item(i)
        #     length = edge.length
        #     ui.messageBox(f"Edge {i} - Length: {length}")

        # Initialize fillets
        fillets = rootComp.features.filletFeatures
        edges_to_fillet = adsk.core.ObjectCollection.create()  # Rename for clarity

        # Identify edges to fillet based on length criteria
        for i in range(body1.edges.count):
            edge = body1.edges.item(i)
            length = edge.length

            # Get edge start and end points
            start_point = edge.startVertex.geometry
            end_point = edge.endVertex.geometry

            # Determine if the edge is vertical
            is_vertical = abs(start_point.x - end_point.x) < 0.001 and abs(start_point.y - end_point.y) < 0.001 and abs(
                start_point.z - end_point.z) > 0.001

            # Identify edges by length within a small tolerance AND ensure it's vertical
            if is_vertical and is_outer_edge(edge, input_model_width) and (
                    abs(length - input_tier_1_extrusion_distance) < 0.01 or
                    abs(length - input_tier_2_extrusion_distance) < 0.01 or
                    abs(length - input_tier_3_extrusion_distance) < 0.01 or
                    abs(length - (
                            input_tier_1_extrusion_distance + input_tier_2_extrusion_distance + input_tier_3_extrusion_distance)) < 0.01):
                # ui.messageBox(f"Adding edge {i} to fillet: Length: {length}")
                edges_to_fillet.add(edge)

        # Create fillet input using createInput()
        fillet_input = fillets.createInput()

        # Add a constant radius edge set
        fillet_input.edgeSetInputs.addConstantRadiusEdgeSet(
            edges_to_fillet,  # Collection of edges to fillet
            adsk.core.ValueInput.createByReal(input_model_fillet_radius),  # Radius = 0.5cm
            True  # Enable tangent chain (G1 continuity)
        )

        # Enable Rolling Ball Corner Type
        fillet_input.isRollingBallCorner = True  # Instead of setting cornerType directly

        # Apply the fillet feature
        fillets.add(fillet_input)

    except:
        if ui:
            ui.messageBox('Failed:{}'.format(traceback.format_exc()))

`;