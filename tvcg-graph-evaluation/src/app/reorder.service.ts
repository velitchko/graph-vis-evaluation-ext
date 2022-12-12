import { Injectable } from '@angular/core';
import * as reorder from 'reorder.js';

@Injectable({
    providedIn: 'root'
})

export class ReorderService {
    // reorder stuff
    private adjacency: any;
    private dist_adjacency: any;
    private leafOrder: any;
    private reorderGraph: any;
    private reorderMatrix: any;
    public algorithms: Array<String>;
    public properties: Map<String, string>;

    constructor() {
        this.algorithms = ['none', 'Leaforder', 'LeaforderDist', 'Barycenter', 'RCM', 'Spectral']; // , 'NN2OPT'
        this.properties = new Map<String, string>();

        this.properties.set('none', 'label');
        this.properties.set('Leaforder', 'leafOrder');
        this.properties.set('LeaforderDist', 'leafOrderDist');
        this.properties.set('Barycenter', 'barycenter');
        this.properties.set('RCM', 'rcm');
        this.properties.set('Spectral', 'spectral');
    }

    reorder(algorithm: String): any {
        switch (algorithm) {
            case 'none': return this.reorderGraph.nodes();
            case 'Leaforder': return this.computeLeaforder();
            case 'LeaforderDist': return this.computeLeaforderDist();
            case 'Barycenter': return this.computeBarycenter();
            case 'RCM': return this.computeRCM();
            case 'Spectral': return this.computeSpectral();
            // case 'NN2OPT': return this.computeNN2OPT();
            default: undefined;
        }
    }

    setGraph(nodes: Array<any>, links: Array<any>): void {
        this.reorderGraph = (reorder as any)
            .graph()
            .nodes(nodes)
            .links(links)
            .init();
        this.reorderMatrix = (reorder as any).graph2mat(this.reorderGraph);

        this.adjacency = this.reorderMatrix.map((row: any) => {
            return row.map((c: any) => { return c.z; });
        });

        this.leafOrder = (reorder as any).optimal_leaf_order().distance((reorder as any).distance.manhattan);
    }

    computeLeaforder(): any {
        if(this.reorderGraph.nodes()[0].leafOrder) {
            console.log('leafOrder already computed');
            return this.reorderGraph.nodes().slice();
        }

        const order = this.leafOrder(this.adjacency);

        order.forEach((lo: any, i: number) => {
            this.reorderGraph.nodes()[i].leafOrder = lo;
        });

        return this.reorderGraph.nodes().slice();
    }

    computeLeaforderDist(): any {
        if(this.reorderGraph.nodes()[0].leafOrderDist) {
            console.log('leafOrderDist already computed');
            return this.reorderGraph.nodes().slice();
        }

        if (!this.dist_adjacency) this.dist_adjacency = (reorder as any).graph2valuemats(this.reorderGraph);

        const order = (reorder as any).valuemats_reorder(this.dist_adjacency, this.leafOrder);

        order.forEach((lo: any, i: number) => {
            this.reorderGraph.nodes()[i].leafOrderDist = lo;
        });
        return this.reorderGraph.nodes().slice();
    }

    computeBarycenter(): any {
        if(this.reorderGraph.nodes()[0].barycenter) {
            console.log('barycenter already computed');
            return this.reorderGraph.nodes().slice();
        }
        const barycenter = (reorder as any).barycenter_order(this.reorderGraph);
        const improved = (reorder as any).adjacent_exchange(this.reorderGraph, barycenter[0], barycenter[1]);
        improved[0].forEach((lo: any, i: number) => {
            this.reorderGraph.nodes()[i].barycenter = lo;
        });

        return this.reorderGraph.nodes().slice();
    }

    computeRCM(): any {
        if(this.reorderGraph.nodes()[0].rcm) {
            console.log('rcm already computed');
            return this.reorderGraph.nodes().slice();
        }
        const rcm = (reorder as any).reverse_cuthill_mckee_order(this.reorderGraph);
        rcm.forEach((lo: any, i: number) => {
            this.reorderGraph.nodes()[i].rcm = lo;
        });

        return this.reorderGraph.nodes().slice();
    }

    computeSpectral(): any {
        if(this.reorderGraph.nodes()[0].spectral) {
            console.log('spectral already computed');
            return this.reorderGraph.nodes().slice();
        } 
        const spectral = (reorder as any).spectral_order(this.reorderGraph);

        spectral.forEach((lo: any, i: number) => {
            this.reorderGraph.nodes()[i].spectral = lo;
        });

        return this.reorderGraph.nodes().slice();
    }

    // This is same as leaforder
    // computeNN2OPT(): any {
    //     const order = this.leafOrder(this.adjacency);

    //     order.forEach((lo: any, i: number) => {
    //         this.reorderGraph.nodes()[i].leafOrder = lo;
    //     });
    //     return this.reorderGraph.nodes();
    // }
};