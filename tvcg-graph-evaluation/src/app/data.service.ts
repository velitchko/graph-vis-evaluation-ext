import { Injectable } from '@angular/core';
import INFOVIS from '../assets/infovis.json';
import NEWCOMB from '../assets/newcomb.json';
import PRIDE from '../assets/pride.json';
import RAMP from '../assets/ramp.json';
import RUGBY from '../assets/rugby.json';
import VANDEBUNT from '../assets/vandebunt.json';
import SFG_EXAMPLE from '../assets/SFG_EXAMPLE.json';
import MOOC from '../assets/mooc.json';
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
  private graph_newcomb = {};
  private graph_pride = {};
  private graph_ramp = {};
  private graph_rugby = {};
  private graph_vandebunt = {};
  private graph_mooc = {};

  // test - example
  private graph_example = {};


  constructor() { 
    this.graph_infovis = INFOVIS;
    console.log(this.graph_infovis);
    // test - example
    this.graph_example = SFG_EXAMPLE;
    this.graph_newcomb = NEWCOMB;
    this.graph_pride = PRIDE;
    this.graph_ramp = RAMP;
    this.graph_rugby = RUGBY;
    this.graph_vandebunt = VANDEBUNT;
    this.graph_mooc = MOOC;
  }

  getGraph(graph: string): Graph {
    
    switch(graph) {
      case 'infovis': return new Graph(this.graph_infovis['nodes'], this.graph_infovis['links']);
      case 'newcomb': return new Graph(this.graph_newcomb['nodes'], this.graph_newcomb['links']);
      case 'pride': return new Graph(this.graph_pride['nodes'], this.graph_pride['links']);
      case 'ramp': return new Graph(this.graph_ramp['nodes'], this.graph_ramp['links']);
      case 'rugby': return new Graph(this.graph_rugby['nodes'], this.graph_rugby['links']);
      case 'vandebunt': return new Graph(this.graph_vandebunt['nodes'], this.graph_vandebunt['links']);
      case 'mooc': return new Graph(this.graph_mooc['nodes'], this.graph_mooc['links']);
      default: return  new Graph(this.graph_example['nodes'], this.graph_example['links']);
    }
  }
}
