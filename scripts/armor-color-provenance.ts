import {readFileSync,writeFileSync} from "node:fs";
import {normalizeDecodedItems} from "../src/server/hypixel/item-normalizer";
const corpus=JSON.parse(readFileSync("data/armor-integration/armor-color-metadata-audit.json","utf8"));
const ids=["GLACITE_LEGGINGS","GLACITE_BOOTS","LAPIS_ARMOR_LEGGINGS","LEGGINGS_OF_THE_COVEN","WIZARDMAN_LEGGINGS","WARM_WIZARD_FACE_2","ANTI_BITE_SCARF_2"];
const examples=ids.map(itemId=>{
 const neu=JSON.parse(readFileSync("data/neu/repository/items/"+itemId+".json","utf8"));
 // Narrow fixture extraction: only a terminal display.color member, with the preceding Name retained.
 const tail=neu.nbttag.match(/Name:"[^"]*",color:(\d+)\}\}$/);
 const packed=tail?Number(tail[1]):null,canonical=corpus.rows.find((i:{itemId:string})=>i.itemId===itemId)?.color??null;
 const rgb=packed===null?null:[packed>>>16&255,packed>>>8&255,packed&255].join(",");
 return {itemId,canonicalRGB:canonical,neuDisplayPacked:packed,neuDisplayRGB:rgb,displayEvidence:tail?.[0]??null,
 canonicalMatchesDisplay:canonical!==null&&rgb!==null?canonical===rgb:null,
 rawLore:neu.lore,selectable:neu.lore.some((l:string)=>l.includes("pick color")),gameplayColor:neu.lore.some((l:string)=>l.includes("Same color = 2x stats")),
 provenance:"Hypixel saved resource metadata versus local NEU template NBT; NEU is not a live player instance"};
});
const synthetic=(color:number)=>normalizeDecodedItems({i:[{id:"minecraft:leather_leggings",Count:1,tag:{display:{Name:"Synthetic",color},ExtraAttributes:{id:"SYNTHETIC",color_marker:"preserved"}}}]});
const report={policy:"CANONICAL_VS_INSTANCE_COLOR_PROVENANCE_V1",sources:corpus.sources,examples,
 counterexamples:corpus.rows.filter((i:{colorLore:string[]})=>i.colorLore.length),
 ingestion:{decoder:"decodeHypixelNbt recursively preserves display.color in decoded NBT",
 normalizer:"normalizeDecodedItems copies display.Name/Lore and ExtraAttributes; display.color is not projected into ItemInstance",
 auction:"normalizeAuction shares normalizeDecodedItems; persisted extraAttributes do not include display.color",
 syntheticDisplayOnlyChangeHasEqualNormalizedResult:JSON.stringify(synthetic(1))===JSON.stringify(synthetic(2)),
 syntheticExtraAttributes:synthetic(1)[0].extraAttributes},
 conclusion:"Canonical resource default appearance and instance NBT are separate inputs. Selectable mechanics are evidenced without canonical color. Exact selectable game storage is not established; no instance-color semantics or support is authorized.",
 scope:"Only static Hypixel item.metadata.color in Dungeon Armor gross acquisition comparison; no NBT/display/color-marker field covered"};
writeFileSync("data/armor-integration/armor-color-provenance-audit.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({examples:examples.map(({rawLore,...e})=>{void rawLore;return e;}),ingestion:report.ingestion}));
