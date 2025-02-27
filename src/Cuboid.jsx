import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
    perspective: 800px;
    width: ${props => props.width}px;
    height: ${props => props.height}px;
`;

const CuboidDiv = styled.div`
    position: relative;
    width: ${props => props.width}px;
    height: ${props => props.height}px;
    transform-style: preserve-3d;
    transform: rotateX(-20deg) rotateY(50deg);
`;

const Face = styled.div`
    position: absolute;
    background: #3b82f6;
`;

const Front = styled(Face)`
    width: ${props => props.width}px;
    height: ${props => props.height}px;
    transform: translateZ(${props => props.depth/2}px);
`;

const Back = styled(Face)`
    width: ${props => props.width}px;
    height: ${props => props.height}px;
    transform: translateZ(${props => -props.depth/2}px);
    background: #2563eb;
`;

const Top = styled(Face)`
    width: ${props => props.width}px;
    height: ${props => props.depth}px;
    transform: rotateX(90deg) translateZ(${props => props.depth/2}px);  /* Changed from height/2 to depth/2 */
    background: #60a5fa;
`;

const Bottom = styled(Face)`
    width: ${props => props.width}px;
    height: ${props => props.depth}px;
    transform: rotateX(-90deg) translateZ(${props => props.height - props.depth/2}px);
    background: #1e40af;
`;

const Left = styled(Face)`
    width: ${props => props.depth}px;
    height: ${props => props.height}px;
    transform: rotateY(-90deg) translateZ(${props => props.width/2}px);
`;

const Right = styled(Face)`
    width: ${props => props.depth}px;
    height: ${props => props.height}px;
    transform: rotateY(90deg) translateZ(${props => props.width/2}px);
    background: #2563eb;
`;

const Cuboid = ({ 
    width = 20,   // Width of the cuboid
    height = 40,  // Height of the cuboid
    depth = 20    // Depth of the cuboid
}) => (
    <Container width={width} height={height}>
        <CuboidDiv width={width} height={height}>
            <Front width={width} height={height} depth={depth} />
            <Back width={width} height={height} depth={depth} />
            <Top width={width} height={height} depth={depth} />
            <Bottom width={width} height={height} depth={depth} />
            <Left width={width} height={height} depth={depth} />
            <Right width={width} height={height} depth={depth} />
        </CuboidDiv>
    </Container>
);

export default Cuboid;