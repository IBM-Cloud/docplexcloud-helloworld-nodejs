// --------------------------------------------------------------------------
// Licensed Materials - Property of IBM
//
// 5725-A06 5725-A29 5724-Y48 5724-Y49 5724-Y54 5724-Y55
// Copyright IBM Corporation 1998, 2014. All Rights Reserved.
//
// Note to U.S. Government Users Restricted Rights:
// Use, duplication or disclosure restricted by GSA ADP Schedule
// Contract with IBM Corp.
// --------------------------------------------------------------------------

// This problem is based on "prob038: Steel mill slab design problem" from
// CSPLib (www.csplib.org). It is a simplification of an industrial problem
// described in J. R. Kalagnanam, M. W. Dawande, M. Trumbo, H. S. Lee.
// "Inventory Matching Problems in the Steel Industry," IBM Research
// Report RC 21171, 1998.
//

using CP;

// The number of coils to produce
tuple TOrder {
   key int index;
   int weight;
   int color;
}
{TOrder} Orders = ...;

tuple TParams {
  int maxNbSlabs;
  int maxColorsPerSlab; 
}

/// single-row table.
TParams Params = ...;

// The total number of slabs available.  In theory this can be unlimited,
// but we impose and reasonable upper bound in order to produce a practical
// optimization model.

// The different slab weights available.
{int} slabWeights = ...;

int nbOrders = card(Orders);
range orderIndexRange = 0..nbOrders-1;

int nbSlabs = Params.maxNbSlabs;
range Slabs = 1..nbSlabs;


{int} allcolors = union(o in Orders) { o.color};

// CP needs arrays
int orderWeights[ i in orderIndexRange ] = item(Orders, i).weight;


// The heaviest slab
int maxSlabWeight = max (sw in slabWeights) sw;

// Which slab is used to produce each coil
dvar int productionSlab[Orders] in Slabs;

// How much of each slab is used
dvar int slabUse[Slabs] in 0..maxSlabWeight;

// The amount of loss incurred for different amounts of slab use
// The loss will depend on how much less steel is used than the slab
// just large enough to produce the coils.
int loss[use in 0..maxSlabWeight] =
  min (sw in slabWeights : sw >= use) (sw - use); 

// The total loss is
dexpr int totalLoss = sum(s in Slabs) loss[slabUse[s]];
//dexpr int totalUsed = sum(s in Slabs) slabUse[s];

execute {
  var f = cp.factory;
  cp.setSearchPhases(f.searchPhase(productionSlab));
}

minimize totalLoss ;

subject to {
  packCt:
    // The orders are allocated to the slabs with capacity
    pack(slabUse, productionSlab, orderWeights);

  forall (s in Slabs) {
    colorCt:
      // At most 2 colors per slab
      sum (c in allcolors) (
        or (o in Orders : o.color == c) (productionSlab[o] == s)
      ) <= Params.maxColorsPerSlab; 
  }
}

{int} fromSlab[s in Slabs] = 
{ o.index | o in Orders : productionSlab[o] == s };


{int} slabColors[s in Slabs] = { o.color | o in Orders : o.index in fromSlab[s] };

tuple TLoss {
   int   slab;
   int   loss;
}
{TLoss} slabLosses;

tuple TPlan {
   int   slab;
   int   order;
   int   color;
}
{TPlan} plan;

execute {
  slabLosses.clear();
  plan.clear();
  for (var s in Slabs) {
    if (Opl.card(fromSlab[s]) > 0) {
      slabLosses.addOnly(s, loss[slabUse[s]]);
      write("Slab " + s + ", Loss = " + loss[slabUse[s]]
          + ", colors =" + slabColors[s] + ", Orders =");
      for (var o in fromSlab[s]) {
        write(" " + o);
      }
      for (var order in Orders) {
        if (productionSlab[order] == s) {
          plan.addOnly(s, order.index, order.color);
	}
      }
      writeln();
    }
  }
}
