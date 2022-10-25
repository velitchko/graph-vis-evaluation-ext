import { Injectable } from '@angular/core';
import INFOVIS from '../assets/infovis.json'
import SFG_EXAMPLE from '../assets/SFG_EXAMPLE.json';
@Injectable({
  providedIn: 'root'
})

export class Graph {
  nodes: Array<{ label: string, id: number, time: Array<number> }>;
  links: Array<{ source: number, target: number, time: Array<number> }>;

  constructor(nodes: Array<{label: string, id: number, time: Array<number>}>, links: Array<{source: number, target: number, time: Array<number> }>) {
    this.nodes = nodes;
    this.links = links;
  }
}

export class DataService {

  private graph_infovis = {};

  // test - example
  private graph_example = {};


  constructor() { 
    this.graph_infovis = INFOVIS;
    console.log(this.graph_infovis);
    // test - example
    this.graph_example = SFG_EXAMPLE;
  }

  getGraph(graph: string): Graph {
    
    switch(graph) {
      case 'infovis': return new Graph(this.graph_infovis['nodes'], this.graph_infovis['links']);
      default: return  new Graph(this.graph_example['nodes'], this.graph_example['links']);
    }
  }
}
