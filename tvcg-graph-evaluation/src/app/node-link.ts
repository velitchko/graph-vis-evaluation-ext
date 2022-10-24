import * as d3 from 'd3';

export class Node implements d3.SimulationNodeDatum {
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number;
    fy?: number;
    label: string;
    id: number;
};

export class Link<Node> implements d3.SimulationLinkDatum<d3.SimulationNodeDatum> {
    source: number | Node;
    target: number | Node;
    time?: Array<number>;

    constructor() {
        this.time = new Array<number>();
    }
}

export class Cell {
    id: string;
    x: number;
    y: number;
    link: number;
    time: Array<number>;

    constructor() {
        this.time = new Array<number>();
    }
}