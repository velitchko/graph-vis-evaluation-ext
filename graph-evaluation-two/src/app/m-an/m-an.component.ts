import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { DataService, Graph } from '../data.service';
import { WIDTH, HEIGHT, NODE_SIZE, LINK_LENGTH, ANIMATION_DURATION } from '../config';
import { Options } from '@angular-slider/ngx-slider';
import { Node, Link } from '../node-link';

@Component({
  selector: 'app-m-an',
  templateUrl: './m-an.component.html',
  styleUrls: ['./m-an.component.scss']
})
export class MAnComponent implements OnInit {
  private graph: Graph;

  private matrix: Array<Node>;

  private svgContainer: d3.Selection<SVGElement, {}, HTMLElement, any>;
  private g: d3.Selection<SVGGElement, {}, HTMLElement, any>;

  value: number = 1;
  options: Options = {
    floor: 1,
    ceil: 4
  };

  constructor(private ds: DataService) { }

  ngOnInit(): void {
    this.graph = this.ds.getGraph('graph_one');
    if(this.graph) {
      this.setup();
      this.init();
    }
  }

  setup(): void {

  }

  init(): void {

  }

}
