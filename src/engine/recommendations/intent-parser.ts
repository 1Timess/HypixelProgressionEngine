import { ProgressionIntentSchema, type ProgressionIntent } from "@/schemas/recommendations";
import type { ItemDefinition } from "@/schemas/items";

export interface IntentParseOptions {
  ownedWeapons?: Pick<ItemDefinition,"id"|"name">[];
  currentWeapon?: ProgressionIntent["currentWeapon"];
  constraints?: ProgressionIntent["constraints"];
  context?: ProgressionIntent["context"];
}
export interface WeaponIntentParseResult {
  status: "READY" | "NEEDS_CLARIFICATION" | "UNSUPPORTED";
  intent: ProgressionIntent | null;
  question: string | null;
  unresolved: string[];
}
const classes = {berserk:"berserk",berserker:"berserk",archer:"archer",mage:"mage",tank:"tank",healer:"healer"} as const;
const escape = (value:string) => value.replace(/[.*+?^$()|[\]{}\\]/g,"\\$&");

/** Deliberately bounded grammar. Unconsumed meaning closes the model gate. */
export function parseWeaponUpgradeIntent(request:string, options:IntentParseOptions = {}):WeaponIntentParseResult {
  if (!request.trim() || request.length > 2000) return {status:"NEEDS_CLARIFICATION",intent:null,question:"Describe the weapon upgrade you want in one or two sentences.",unresolved:["EMPTY_OR_TOO_LONG"]};
  let text=request.normalize("NFKC").replace(/[‘]/g,"'").toLowerCase().replace(/(\d),(?=\d{3}\b)/g,"$1");
  const unresolved:string[]=[];
  if(/\b(?:armor|armour|accessor(?:y|ies)|pets?|mining|fishing|farming|switch|change (?:my )?(?:build|class))\b/.test(text)) {
    return {status:"UNSUPPORTED",intent:null,question:"This recommendation flow currently supports upgrading your current weapon build.",unresolved:["OUTSIDE_WEAPON_UPGRADE"]};
  }
  if(!/\b(?:upgrad(?:e|ing)|replac(?:e|ing)|better|improve)\b/.test(text)) unresolved.push("UPGRADE_OBJECTIVE_UNCLEAR");

  let currentWeapon=options.currentWeapon;
  const named = new Set<string>();
  const matches:{start:number;end:number;id:string}[]=[];
  for(const weapon of options.ownedWeapons??[]) {
    const full=weapon.name.replace(/§[0-9a-fk-or]/gi,"").toLowerCase();
    const acronym=full.split(/\s+/).map(word=>word[0]).join("");
    for(const name of [full,...(acronym.length>=3?[acronym]:[])]) {
      const pattern=new RegExp("\\b(?:my|using|use|from|replacing)\\s+(?:current\\s+|primary\\s+)?"+escape(name)+"\\b","g");
      for(const match of text.matchAll(pattern)) matches.push({start:match.index!,end:match.index!+match[0].length,id:weapon.id});
    }
  }
  for(const match of matches) named.add(match.id);
  for(const match of matches.sort((a,b)=>b.start-a.start)) text=text.slice(0,match.start)+" ".repeat(match.end-match.start)+text.slice(match.end);
  if(named.size>1) unresolved.push("MULTIPLE_CURRENT_WEAPONS");
  if(named.size===1) {
    const itemId=[...named][0];
    if(currentWeapon && currentWeapon.itemId!==itemId) unresolved.push("CONFLICTING_CURRENT_WEAPON");
    else currentWeapon=currentWeapon??{itemId};
  }
  const constraints:ProgressionIntent["constraints"]={};
  const budgets:{maxCoins:number;strength:"REQUIRED"|"PREFERRED"}[]=[];
  const budgetPattern=/\b(?:(under|below|less than|up to|at most|budget(?: of| is)?|have|got|with|spend(?:ing)?(?: up to)?|around|about|prefer(?:ably)?(?: under)?)\s+)?(\d+(?:\.\d+)?)\s*(million|billion|thousand|m|k|b)?\s*(coins?)?\b/g;
  text=text.replace(budgetPattern,(whole,prefix:string|undefined,amount:string,unit:string|undefined,coins:string|undefined)=>{
    if(!unit && !coins && !prefix) return whole;
    const scale=unit==="m"||unit==="million"?1e6:unit==="b"||unit==="billion"?1e9:unit==="k"||unit==="thousand"?1e3:1;
    let maxCoins=Number(amount)*scale;
    if(prefix && /^(under|below|less than)$/.test(prefix)) maxCoins-=1;
    if(!Number.isSafeInteger(maxCoins)||maxCoins<0) {unresolved.push("INVALID_BUDGET");return " ";}
    budgets.push({maxCoins,strength:prefix&&/^(around|about|prefer)/.test(prefix)?"PREFERRED":"REQUIRED"});
    return " ";
  });
  if(budgets.length) {
    if(budgets.some(b=>b.maxCoins!==budgets[0].maxCoins||b.strength!==budgets[0].strength)) unresolved.push("CONFLICTING_BUDGETS");
    else constraints.budget=budgets[0];
  }
  const mentionedClasses=new Set<"healer"|"mage"|"berserk"|"archer"|"tank">();
  text=text.replace(/\b(berserker|berserk|archer|mage|tank|healer)\b/g,(_,name:keyof typeof classes)=>{mentionedClasses.add(classes[name]);return " ";});
  if(mentionedClasses.size>1) unresolved.push("MULTIPLE_CLASSES");
  if(mentionedClasses.size===1) constraints.dungeonClass={value:[...mentionedClasses][0],strength:"REQUIRED"};
  const dungeon=/\b(?:dungeons?|catacombs)\b/.test(text)||mentionedClasses.size>0;
  const general=/\b(?:general|outside (?:of )?dungeons?|overworld)\b/.test(text);
  if(dungeon&&general) unresolved.push("CONFLICTING_CONTEXT");
  text=text.replace(/\b(?:dungeons?|catacombs|general|overworld)\b/g," ");
  const forms=new Set<"MELEE"|"RANGED">();
  text=text.replace(/\b(?:melee|ranged|bows?|swords?)\b/g,word=>{forms.add(/^(ranged|bow)/.test(word)?"RANGED":"MELEE");return " ";});
  if(forms.size>1) unresolved.push("MULTIPLE_WEAPON_FORMS");
  if(forms.size===1) constraints.weaponForm={value:[...forms][0],strength:"REQUIRED"};
  const capabilities: NonNullable<ProgressionIntent["constraints"]["capabilities"]>["values"]=[];
  text=text.replace(/\b(?:ability[ -]damage|mobility|teleport(?:ation)?|healing|control)\b/g,word=>{
    capabilities.push(/ability/.test(word)?"ABILITY_DAMAGE":/mobility|teleport/.test(word)?"MOBILITY":word==="healing"?"HEALING":"CONTROL");return " ";
  });
  if(capabilities.length) constraints.capabilities={values:[...new Set(capabilities)],strength:"REQUIRED"};
  // Only grammatical scaffolding is discarded. Negation and unsupported meaning remain.
  text=text.replace(/\b(?:what|which|should|would|could|can|i|i'm|i've|my|me|you|please|want|looking|like|need|have|got|to|for|in|the|a|an|and|with|of|as|is|be|it|current|primary|main|damage|weapon|weapons|upgrade|upgrading|replace|replacing|better|improve|recommend|recommendation|buy|next|do|use|using|from|budget|coins?|get)\b/g," ");
  const rest=text.replace(/[?!.,:;'"]/g," ").replace(/\s+/g," ").trim();
  if(rest) unresolved.push(rest);
  const context=options.context??(dungeon?"dungeon":"general");
  if(options.context==="general"&&dungeon) unresolved.push("CONFLICTING_CONTEXT");
  const intent=ProgressionIntentSchema.parse({
    domain:"weapon",context,objective:"UPGRADE_CURRENT_BUILD",constraints:{...constraints,...options.constraints},
    ...(currentWeapon?{currentWeapon}:{}),metadata:{parser:"DETERMINISTIC",unresolved:[...new Set(unresolved)]},
  });
  return {status:unresolved.length?"NEEDS_CLARIFICATION":"READY",intent,
    question:unresolved.length?"Please clarify the request: "+[...new Set(unresolved)].join("; ")+".":null,unresolved:intent.metadata.unresolved};
}
