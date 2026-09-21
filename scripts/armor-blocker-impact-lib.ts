export interface ImpactCandidate {candidateId:string;blockers:{family:string;stage:string;itemId:string}[]}
export function blockerImpact(candidates:ImpactCandidate[]){
 const sets=candidates.map(c=>new Set(c.blockers.map(b=>b.family)));
 const families=[...new Set(sets.flatMap(s=>[...s]))].sort();
 const pairs=candidates.length*(candidates.length-1)/2,currentlyClearCandidates=sets.filter(s=>!s.size).length;
 return families.map(family=>{
  const affected=candidates.filter((_,i)=>sets[i].has(family));
  const sourceSole=affected.filter(c=>{const s=new Set(c.blockers.filter(b=>b.stage.endsWith("SOURCE_PROBE")).map(b=>b.family));return s.size===1&&s.has(family);}).length;
  let pairCount=0,solePairCount=0;
  const overlap:Record<string,{candidateCount:number;pairCount:number}>={};
  for(const other of families)if(other!==family){
   let candidateCount=0,pairOverlap=0;
   for(const s of sets)if(s.has(family)&&s.has(other))candidateCount++;
   for(let i=0;i<sets.length;i++)for(let j=i+1;j<sets.length;j++)
    if((sets[i].has(family)||sets[j].has(family))&&(sets[i].has(other)||sets[j].has(other)))pairOverlap++;
   if(candidateCount||pairOverlap)overlap[other]={candidateCount,pairCount:pairOverlap};
  }
  for(let i=0;i<sets.length;i++)for(let j=i+1;j<sets.length;j++){
   const union=new Set([...sets[i],...sets[j]]);
   if(union.has(family)){pairCount++;if(union.size===1)solePairCount++;}
  }
  return {family,candidateCount:affected.length,distinctItemCount:new Set(affected.flatMap(c=>c.blockers.filter(b=>b.family===family).map(b=>b.itemId))).size,
   pairCount,totalPairs:pairs,soleRecordedBlockerCandidates:sets.filter(s=>s.size===1&&s.has(family)).length,
   soleRecordedBlockerPairs:solePairCount,sourceProbeSoleBlockerCandidates:sourceSole,currentlyClearCandidates,
   reportingOnlyClearanceCandidateIds:affected.filter(c=>new Set(c.blockers.map(b=>b.family)).size===1).map(c=>c.candidateId),
   guaranteedNewSourceClosedCandidates:0,actualNewSourceClosedCandidates:null,actualPairsAdvancing:null,
   reason:"Production guards were not suppressed. Removing recorded failures leaves hidden subsequent guards untested; recorded clearance is an optimistic bound, not source closure or pair comparability.",overlap};
 });
}
