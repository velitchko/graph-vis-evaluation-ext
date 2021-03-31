import { Injectable } from '@angular/core';
import  SFG_30_44 from '../../../python/SFG_30_44.json';

@Injectable({
  providedIn: 'root'
})

export class Graph {
  nodes: Array<{label: string, id: number, time?: number}>;
  links: Array<{source: number, target: number, key: number}>;

  constructor(nodes: Array<{label: string, id: number}>, links: Array<{source: number, target: number, key: number}>) {
    this.nodes = nodes;
    this.links = links;

    this.nodes.forEach((n: {label: string, id: number, time?: number}) => {
      n.time = Math.floor(Math.random()*4) + 1;
    });
  }
}

export class DataService {

  private graph_one = {};
  private graph_two = {};
  private graph_three = {};
  private graph_four = {};
  private graph_five = {};
  private graph_six = {};
  private graph_seven = {};
  private graph_eight = {};
  private graph_nine = {};

  constructor() { 
    
    this.graph_one = SFG_30_44;
  }

  getGraph(graph: string): Graph {
    switch(graph) {
      case 'graph_one': return new Graph(this.graph_one['nodes'], this.graph_one['links']);
      case 'graph_two': return  new Graph(this.graph_one['nodes'], this.graph_one['links']);;
      case 'graph_three': return  new Graph(this.graph_one['nodes'], this.graph_one['links']);;
      case 'graph_four': return  new Graph(this.graph_one['nodes'], this.graph_one['links']);;
      case 'graph_five': return  new Graph(this.graph_one['nodes'], this.graph_one['links']);;
      case 'graph_six': return  new Graph(this.graph_one['nodes'], this.graph_one['links']);;
      case 'graph_seven': return  new Graph(this.graph_one['nodes'], this.graph_one['links']);;
      case 'graph_eight': return  new Graph(this.graph_one['nodes'], this.graph_one['links']);;
      case 'graph_nine': return  new Graph(this.graph_one['nodes'], this.graph_one['links']);;
      default: return null;
    }
  }
}
