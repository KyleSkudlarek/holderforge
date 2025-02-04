export const pythonTemplate = `
import adsk.core, adsk.fusion, adsk.cam, traceback

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

    input_tier_2_total_depth = {{input_tier_2_total_depth}}
    input_tier_2_extrusion_distance = {{input_tier_2_extrusion_distance}}
    input_row_2_hole_diameter = {{input_row_2_hole_diameter}}
    input_row_2_hole_horizontal_constraint = {{input_row_2_hole_horizontal_constraint}}
    input_row_2_hole_vertical_constraint = {{input_row_2_hole_vertical_constraint}}
    input_row_2_hole_height = {{input_row_2_hole_height}}
    input_row_2_rectangular_repeat_pattern_distance = {{input_row_2_rectangular_repeat_pattern_distance}}

    input_tier_3_total_depth = {{input_tier_3_total_depth}}
    input_tier_3_extrusion_distance = {{input_tier_3_extrusion_distance}}
    input_row_3_hole_diameter = {{input_row_3_hole_diameter}}
    input_row_3_hole_horizontal_constraint = {{input_row_3_hole_horizontal_constraint}}
    input_row_3_hole_vertical_constraint = {{input_row_3_hole_vertical_constraint}}
    input_row_3_hole_height = {{input_row_3_hole_height}}
    input_row_3_rectangular_repeat_pattern_distance = {{input_row_3_rectangular_repeat_pattern_distance}}

    ui = None
    try:
        app = adsk.core.Application.get()
        ui  = app.userInterface
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
        extrude1 = extrudes.addSimple(base_profile1, extrusion_distance1, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
        
        # Get the extrusion body
        body1 = extrude1.bodies.item(0)
        body1.name = "simple"

        # Create a Center Diameter Circle on the top of body1 with contraints 
        # Get top xy face of body1
        top_face = body1.faces.item(4)  # This is the top face of the rectangle body
        top_sketch = sketches.add(top_face)

        # Project edges into new sketch (important for constraints)
        edges = top_face.edges
        for edge in edges:
            top_sketch.project(edge)

        # Create circle
        circles = top_sketch.sketchCurves.sketchCircles
        circle_center = adsk.core.Point3D.create(1, 1, 0)  # Adjust Z to match extrusion height
        circle = circles.addByCenterRadius(circle_center, input_row_1_hole_diameter/2)

        # Get projected edges (left and bottom)
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

        # # Debug log after edge identification
        # ui.messageBox(f"Bottom edge - Start: ({bottom_edge.startSketchPoint.geometry.x}, {bottom_edge.startSketchPoint.geometry.y}), End: ({bottom_edge.endSketchPoint.geometry.x}, {bottom_edge.endSketchPoint.geometry.y})")
        # ui.messageBox(f"Left edge - Start: ({left_edge.startSketchPoint.geometry.x}, {left_edge.startSketchPoint.geometry.y}), End: ({left_edge.endSketchPoint.geometry.x}, {left_edge.endSketchPoint.geometry.y})")


        # Add distance constraints
        dimensions = top_sketch.sketchDimensions


        # Position constraints
        horizontal_dim = dimensions.addOffsetDimension(
            left_edge,
            circle.centerSketchPoint, 
            adsk.core.Point3D.create(circle_center.x/2, circle_center.y, circle_center.z),
            True
        )
        horizontal_dim.parameter.expression = str(input_row_1_hole_horizontal_constraint * 10)

        vertical_dim = dimensions.addOffsetDimension(
            bottom_edge,
            circle.centerSketchPoint,
            adsk.core.Point3D.create(circle_center.x, circle_center.y/2, circle_center.z),
            True
        )
        vertical_dim.parameter.expression = str(input_row_1_hole_vertical_constraint * 10)

        # For diameter dimension
        diameter_dim = dimensions.addDiameterDimension(
            circle,
            adsk.core.Point3D.create(circle_center.x + 0.5, circle_center.y + 0.75, circle_center.z),  # Adjusted text position
            True
        )
        diameter_dim.parameter.expression = str(input_row_1_hole_diameter * 10)

        top_sketch.isVisible = False  # Finish the sketch
        top_sketch.isVisible = True   # Make it visible again


        # for i in range(top_sketch.profiles.count):
        #     area = top_sketch.profiles.item(i).areaProperties().area
        #     ui.messageBox(f"Profile {i} area: {area}")

        # Get circle profile and extrude
        circle_profile = top_sketch.profiles.item(1)  # May need to adjust index
        extrusion_distance2 = adsk.core.ValueInput.createByReal(-1*(input_row_1_hole_height))  # Negative for cut direction
        extrude2 = extrudes.addSimple(circle_profile, extrusion_distance2, adsk.fusion.FeatureOperations.CutFeatureOperation)
  
        # Repeat extrusion across row
        patterns = rootComp.features.rectangularPatternFeatures

        # Input for rectangular pattern
        features = adsk.core.ObjectCollection.create()
        features.add(extrude2)  # Add the cut extrusion feature

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




        # Create first tier rectangle
        upper_sketch = sketches.add(top_face)
        upper_sketch_lines = upper_sketch.sketchCurves.sketchLines
        start_point = adsk.core.Point3D.create(0, input_model_depth, 0)  # 81mm in cm
        end_point = adsk.core.Point3D.create(input_model_width, input_model_depth - input_tier_2_total_depth, 0)   # 120mm x 54mm
        upper_sketch_lines.addTwoPointRectangle(start_point, end_point)



        # Find the profile that is the rectangle we just drew
        # for i in range(upper_sketch.profiles.count):
        #     area = upper_sketch.profiles.item(i).areaProperties().area
        #     ui.messageBox(f"Profile {i} area: {area}")

        # Extrude the rectangle, creating first tier
        upper_profile = upper_sketch.profiles.item(5)
        upper_extrusion_distance = adsk.core.ValueInput.createByReal(input_tier_2_extrusion_distance)
        upper_extrude = extrudes.addSimple(
            upper_profile, 
            upper_extrusion_distance, 
            adsk.fusion.FeatureOperations.JoinFeatureOperation)
        
        # Find top face of tier 1
        # for i in range(body1.faces.count):
        #     face = body1.faces.item(i)
        #     point = face.geometry.origin
        #     ui.messageBox(f"Face {i} - Normal Z: {face.geometry.normal.z}, Position Z: {point.z}")


        # Create new circle on tier 1
        upper_top_face = body1.faces.item(1)  # Adjust index based on debug output
        upper_circle_sketch = sketches.add(upper_top_face)

        # Project edges
        upper_edges = upper_top_face.edges
        for edge in upper_edges:
            upper_circle_sketch.project(edge)

        # Create circle
        upper_circles = upper_circle_sketch.sketchCurves.sketchCircles
        upper_circle_center = adsk.core.Point3D.create(1.3, 4, 0)
        upper_circle = upper_circles.addByCenterRadius(upper_circle_center, input_row_2_hole_diameter/2)

        # Tier 1 projected edges for constraints
        upper_circle_projected_edges = upper_circle_sketch.sketchCurves.sketchLines

        # Identify edges for constraints
        for i in range(upper_circle_projected_edges.count):
            edge = upper_circle_projected_edges.item(i)
            start = edge.startSketchPoint.geometry
            end = edge.endSketchPoint.geometry
            
            if abs(start.y - (input_model_depth-input_tier_2_total_depth)) < 0.001 and abs(end.y - (input_model_depth-input_tier_2_total_depth)) < 0.001:
                upper_bottom_edge = edge
            if abs(start.x - 0) < 0.001 and abs(end.x - 0) < 0.001:
                upper_left_edge = edge

        # After edge identification, add debug output
        # ui.messageBox(f"Upper bottom edge - Start: ({upper_bottom_edge.startSketchPoint.geometry.x}, {upper_bottom_edge.startSketchPoint.geometry.y}), End: ({upper_bottom_edge.endSketchPoint.geometry.x}, {upper_bottom_edge.endSketchPoint.geometry.y})")
        # ui.messageBox(f"Upper left edge - Start: ({upper_left_edge.startSketchPoint.geometry.x}, {upper_left_edge.startSketchPoint.geometry.y}), End: ({upper_left_edge.endSketchPoint.geometry.x}, {upper_left_edge.endSketchPoint.geometry.y})")

        # Add constraints
        upper_dimensions = upper_circle_sketch.sketchDimensions

        horizontal_dim = upper_dimensions.addOffsetDimension(
            upper_left_edge,
            upper_circle.centerSketchPoint, 
            adsk.core.Point3D.create(upper_circle_center.x/2, upper_circle_center.y, upper_circle_center.z),
            True
        )
        horizontal_dim.parameter.expression = str(input_row_2_hole_horizontal_constraint * 10)


        vertical_dim = upper_dimensions.addOffsetDimension(
            upper_bottom_edge,
            upper_circle.centerSketchPoint,
            adsk.core.Point3D.create(upper_circle_center.x, upper_circle_center.y/2, upper_circle_center.z),
            True
        )
        vertical_dim.parameter.expression = str(input_row_2_hole_vertical_constraint * 10)

        diameter_dim = upper_dimensions.addDiameterDimension(
            upper_circle,
            adsk.core.Point3D.create(upper_circle_center.x + 0.5, upper_circle_center.y + 0.75, upper_circle_center.z),
            True
        )
        diameter_dim.parameter.expression = str(input_row_2_hole_diameter * 10)

        # for i in range(upper_circle_sketch.profiles.count):
        #     area = upper_circle_sketch.profiles.item(i).areaProperties().area
        #     ui.messageBox(f"Profile {i} area: {area}")

        # Extrude first tier circle
        circle_profile = upper_circle_sketch.profiles.item(1)  # May need to adjust index
        extrusion_distance2 = adsk.core.ValueInput.createByReal(-1*(input_row_2_hole_height))  # Negative for cut direction
        extrude2 = extrudes.addSimple(
            circle_profile, 
            extrusion_distance2, 
            adsk.fusion.FeatureOperations.CutFeatureOperation
            )

        # Pattern the first tier circle cut
        patterns = rootComp.features.rectangularPatternFeatures
        features = adsk.core.ObjectCollection.create()
        features.add(extrude2)

        quantity = adsk.core.ValueInput.createByReal(5)
        distance = adsk.core.ValueInput.createByReal(input_row_2_rectangular_repeat_pattern_distance)

        patternInput = patterns.createInput(
            features, 
            upper_bottom_edge,  # Use bottom edge from upper tier
            quantity,
            distance,
            adsk.fusion.PatternDistanceType.ExtentPatternDistanceType
        )

        # Create the pattern
        upper_pattern = patterns.add(patternInput)


        # Create second tier rectangle
        second_tier_sketch = sketches.add(upper_top_face)
        second_tier_sketch_lines= second_tier_sketch.sketchCurves.sketchLines
        tier2_start = adsk.core.Point3D.create(0, input_model_depth, 0)
        tier2_end = adsk.core.Point3D.create(input_model_width, input_model_depth - input_tier_3_total_depth, 0)
        second_tier_sketch_lines.addTwoPointRectangle(tier2_start, tier2_end)


        ## Find the profile that is the rectangle we just drew (#5)
        # for i in range(second_tier_sketch.profiles.count):
        #     area = second_tier_sketch.profiles.item(i).areaProperties().area
        #     ui.messageBox(f"Profile {i} area: {area}")

        # Extrude second tier rectangle
        second_tier_profile = second_tier_sketch.profiles.item(5)  # Update index based on debug output
        second_tier_distance = adsk.core.ValueInput.createByReal(input_tier_3_extrusion_distance)
        second_tier_extrude = extrudes.addSimple(
            second_tier_profile, 
            second_tier_distance, 
            adsk.fusion.FeatureOperations.JoinFeatureOperation
        )

        # Find top face of tier 2 (item = 1)
        # for i in range(body1.faces.count):
        #     face = body1.faces.item(i)
        #     point = face.geometry.origin
        #     ui.messageBox(f"Face {i} - Normal Z: {face.geometry.normal.z}, Position Z: {point.z}")
        
        # Create new circle on tier 2
        second_tier_top_face = body1.faces.item(1)  # Update index from debug
        second_tier_circle_sketch = sketches.add(second_tier_top_face)

        # Project edges
        second_tier_edges = second_tier_top_face.edges
        for edge in second_tier_edges:
            second_tier_circle_sketch.project(edge)

        # Create circle
        second_tier_circles = second_tier_circle_sketch.sketchCurves.sketchCircles
        second_tier_circle_center = adsk.core.Point3D.create(1.3, 6.8, 0)
        second_tier_circle = second_tier_circles.addByCenterRadius(second_tier_circle_center, input_row_3_hole_diameter/2)

        # Identify edges
        second_tier_projected_edges = second_tier_circle_sketch.sketchCurves.sketchLines
        for i in range(second_tier_projected_edges.count):
            edge = second_tier_projected_edges.item(i)
            start = edge.startSketchPoint.geometry
            end = edge.endSketchPoint.geometry
        
            if abs(start.y - (input_model_depth-input_tier_3_total_depth)) < 0.001 and abs(end.y - (input_model_depth-input_tier_3_total_depth)) < 0.001:
                second_tier_bottom_edge = edge
            if abs(start.x - 0) < 0.001 and abs(end.x - 0) < 0.001:
                second_tier_left_edge = edge

        # # Debug edge identification
        # ui.messageBox(f"Second tier bottom edge - Start: ({second_tier_bottom_edge.startSketchPoint.geometry.x}, {second_tier_bottom_edge.startSketchPoint.geometry.y}), End: ({second_tier_bottom_edge.endSketchPoint.geometry.x}, {second_tier_bottom_edge.endSketchPoint.geometry.y})")
        # ui.messageBox(f"Second tier left edge - Start: ({second_tier_left_edge.startSketchPoint.geometry.x}, {second_tier_left_edge.startSketchPoint.geometry.y}), End: ({second_tier_left_edge.endSketchPoint.geometry.x}, {second_tier_left_edge.endSketchPoint.geometry.y})")


        # Add dimension constraints
        second_tier_dimensions = second_tier_circle_sketch.sketchDimensions

        second_tier_horizontal_dim = second_tier_dimensions.addOffsetDimension(
            second_tier_left_edge,
            second_tier_circle.centerSketchPoint,
            adsk.core.Point3D.create(second_tier_circle_center.x/2, second_tier_circle_center.y, second_tier_circle_center.z),
            True
        )
        second_tier_horizontal_dim.parameter.expression = str(input_row_3_hole_horizontal_constraint * 10)

        second_tier_vertical_dim = second_tier_dimensions.addOffsetDimension(
            second_tier_bottom_edge,
            second_tier_circle.centerSketchPoint,
            adsk.core.Point3D.create(second_tier_circle_center.x, second_tier_circle_center.y/2, second_tier_circle_center.z),
            True
        )
        second_tier_vertical_dim.parameter.expression = str(input_row_3_hole_vertical_constraint * 10)

        second_tier_diameter_dim = second_tier_dimensions.addDiameterDimension(
            second_tier_circle,
            adsk.core.Point3D.create(second_tier_circle_center.x + 0.5, second_tier_circle_center.y + 0.75, second_tier_circle_center.z),
            True
        )
        second_tier_diameter_dim.parameter.expression = str(input_row_3_hole_diameter * 10)

        # # Debug circle profile areas (item=1)
        # for i in range(second_tier_circle_sketch.profiles.count):
        #     area = second_tier_circle_sketch.profiles.item(i).areaProperties().area
        #     ui.messageBox(f"Profile {i} area: {area}")



        # Extrude second tier circle
        second_tier_circle_profile = second_tier_circle_sketch.profiles.item(1)  # Update index from debug
        second_tier_cut_distance = adsk.core.ValueInput.createByReal(-1 * input_row_3_hole_height)
        second_tier_circle_extrude = extrudes.addSimple(
            second_tier_circle_profile,
            second_tier_cut_distance,
            adsk.fusion.FeatureOperations.CutFeatureOperation
        )

        # Pattern second tier circle cuts
        patterns = rootComp.features.rectangularPatternFeatures
        second_tier_features = adsk.core.ObjectCollection.create()
        second_tier_features.add(second_tier_circle_extrude)

        quantity = adsk.core.ValueInput.createByReal(5)
        distance = adsk.core.ValueInput.createByReal(input_row_3_rectangular_repeat_pattern_distance)

        second_tier_pattern_input = patterns.createInput(
            second_tier_features,
            second_tier_bottom_edge,
            quantity,
            distance,
            adsk.fusion.PatternDistanceType.ExtentPatternDistanceType
        )

        second_tier_pattern = patterns.add(second_tier_pattern_input)


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
            # Identify edges by length within a small tolerance
            if (abs(length - input_tier_1_extrusion_distance) < 0.01 or  # Tier 1 vertical
                abs(length - input_tier_2_extrusion_distance) < 0.01 or  # Tier 2 vertical
                abs(length - input_tier_3_extrusion_distance) < 0.01 or  # Tier 3 vertical
                abs(length - (input_tier_1_extrusion_distance + input_tier_2_extrusion_distance + input_tier_3_extrusion_distance )) < 0.01):   # Long back vertical
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