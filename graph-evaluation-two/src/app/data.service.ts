import { Injectable } from '@angular/core';
import  SFG_30_37 from '../../../python/SFG_30_37.json';
import SFG_30_39 from '../../../python/SFG_30_39.json';
import SFG_30_42 from '../../../python/SFG_30_42.json'
import SFG_30_43 from '../../../python/SFG_30_43.json'
import SFG_30_44 from '../../../python/SFG_30_44.json'
@Injectable({
  providedIn: 'root'
})

export class Graph {
  nodes: Array<{ label: string, id: number }>;
  links: Array<{ source: number, target: number, time: Array<number> }>;

  constructor(nodes: Array<{label: string, id: number}>, links: Array<{source: number, target: number, time: Array<number> }>) {
    this.nodes = nodes;
    this.links = links;
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
    this.graph_one = SFG_30_37;
    this.graph_two = SFG_30_39;
    this.graph_three = SFG_30_42;
    this.graph_four = SFG_30_43;
    this.graph_five = SFG_30_44;
  }

  getGraph(graph: string): Graph {
    
    switch(graph) {
      case 'graph_one': return new Graph(this.graph_one['nodes'], this.graph_one['links']);
      case 'graph_two': return  new Graph(this.graph_two['nodes'], this.graph_two['links']);;
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
