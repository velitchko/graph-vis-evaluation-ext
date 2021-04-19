import { Injectable } from '@angular/core';
// No Clique
import SFG_35_52 from '../assets/SFG_35_52.json';
import SFG_36_46 from '../assets/SFG_36_46.json';
import SFG_37_48 from '../assets/SFG_37_48.json';
import SFG_39_53 from '../assets/SFG_39_53.json';
import SFG_40_53 from '../assets/SFG_40_53.json';
import SFG_40_54 from '../assets/SFG_40_54.json';
import SFG_41_57 from '../assets/SFG_41_57.json';
import SFG_42_61 from '../assets/SFG_42_61.json';
import SFG_43_54 from '../assets/SFG_43_54.json';
import SFG_43_55 from '../assets/SFG_43_55.json';
import SFG_44_60 from '../assets/SFG_44_60.json';
import SFG_45_56 from '../assets/SFG_45_56.json';
// Clique
import SFG_35_55_clique from '../assets/SFG_35_55_clique.json';
import SFG_37_60_clique from '../assets/SFG_37_60_clique.json';
import SFG_38_52_clique from '../assets/SFG_38_52_clique.json';
import SFG_38_66_clique from '../assets/SFG_38_66_clique.json';
import SFG_39_62_clique from '../assets/SFG_39_62_clique.json';
import SFG_40_63_clique from '../assets/SFG_40_63_clique.json';
import SFG_41_69_clique from '../assets/SFG_41_69_clique.json';
import SFG_42_66_clique from '../assets/SFG_42_66_clique.json';
import SFG_43_70_clique from '../assets/SFG_43_70_clique.json';
import SFG_44_63_clique from '../assets/SFG_44_63_clique.json';
import SFG_45_70_clique from '../assets/SFG_45_70_clique.json';
import SFG_45_71_clique from '../assets/SFG_45_71_clique.json';

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
  private graph_ten = {};
  private graph_eleven = {};
  private graph_twelve = {};
  private graph_thirteen = {};
  private graph_fourteen = {};
  private graph_fifteen = {};
  private graph_sixteen = {};
  private graph_seventeen = {};
  private graph_eighteen = {};
  private graph_nineteen = {};
  private graph_twenty = {};
  private graph_twentyone = {};
  private graph_twentytwo = {};
  private graph_twentythree = {};
  private graph_twentyfour = {};


  constructor() { 
    // No Clique
    this.graph_one = SFG_35_52;
    this.graph_two = SFG_36_46;
    this.graph_three = SFG_37_48;
    this.graph_four = SFG_39_53;
    this.graph_five = SFG_40_53;
    this.graph_six = SFG_40_54;
    this.graph_seven = SFG_41_57;
    this.graph_eight = SFG_42_61;
    this.graph_nine = SFG_43_54;
    this.graph_ten = SFG_43_55;
    this.graph_eleven = SFG_44_60;
    this.graph_twelve = SFG_45_56;
    // Clique
    this.graph_thirteen = SFG_35_55_clique;
    this.graph_fourteen = SFG_37_60_clique;
    this.graph_fifteen = SFG_38_52_clique;
    this.graph_sixteen = SFG_38_66_clique;
    this.graph_seventeen = SFG_39_62_clique;
    this.graph_eighteen = SFG_40_63_clique;
    this.graph_nineteen = SFG_41_69_clique;
    this.graph_twenty = SFG_42_66_clique;
    this.graph_twentyone = SFG_43_70_clique;
    this.graph_twentytwo = SFG_44_63_clique;
    this.graph_twentythree = SFG_45_70_clique;
    this.graph_twentyfour = SFG_45_71_clique;
  }

  getGraph(graph: string): Graph {
    
    switch(graph) {
      case 'graph_one': return new Graph(this.graph_one['nodes'], this.graph_one['links']);
      case 'graph_two': return  new Graph(this.graph_two['nodes'], this.graph_two['links']);;
      case 'graph_three': return  new Graph(this.graph_three['nodes'], this.graph_three['links']);
      case 'graph_four': return  new Graph(this.graph_four['nodes'], this.graph_four['links']);
      case 'graph_five': return  new Graph(this.graph_five['nodes'], this.graph_five['links']);
      case 'graph_six': return  new Graph(this.graph_six['nodes'], this.graph_six['links']);
      case 'graph_seven': return  new Graph(this.graph_seven['nodes'], this.graph_seven['links']);
      case 'graph_eight': return  new Graph(this.graph_eight['nodes'], this.graph_eight['links']);
      case 'graph_nine': return  new Graph(this.graph_nine['nodes'], this.graph_nine['links']);
      case 'graph_ten': return  new Graph(this.graph_ten['nodes'], this.graph_ten['links']);
      case 'graph_eleven': return  new Graph(this.graph_eleven['nodes'], this.graph_eleven['links']);
      case 'graph_twelve': return  new Graph(this.graph_twelve['nodes'], this.graph_twelve['links']);
      case 'graph_thirteen': return  new Graph(this.graph_thirteen['nodes'], this.graph_thirteen['links']);
      case 'graph_fourteen': return  new Graph(this.graph_fourteen['nodes'], this.graph_fourteen['links']);
      case 'graph_fifteen': return  new Graph(this.graph_fifteen['nodes'], this.graph_fifteen['links']);
      case 'graph_sixteen': return  new Graph(this.graph_sixteen['nodes'], this.graph_nine['links']);
      case 'graph_seventeen': return  new Graph(this.graph_seventeen['nodes'], this.graph_seventeen['links']);
      case 'graph_eighteen': return  new Graph(this.graph_eighteen['nodes'], this.graph_eighteen['links']);
      case 'graph_nineteen': return  new Graph(this.graph_nineteen['nodes'], this.graph_nineteen['links']);
      case 'graph_twenty': return  new Graph(this.graph_twenty['nodes'], this.graph_twenty['links']);
      case 'graph_twentyone': return  new Graph(this.graph_twentyone['nodes'], this.graph_twentyone['links']);
      case 'graph_twentytwo': return  new Graph(this.graph_twentytwo['nodes'], this.graph_twentytwo['links']);
      case 'graph_twentythree': return  new Graph(this.graph_twentythree['nodes'], this.graph_twentythree['links']);
      case 'graph_twentyfour': return  new Graph(this.graph_twentyfour['nodes'], this.graph_twentyfour['links']);
      default: return null;
    }
  }
}
