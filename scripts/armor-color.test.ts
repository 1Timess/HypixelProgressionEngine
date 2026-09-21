import test from "node:test";
import assert from "node:assert/strict";
import {ItemDefinitionSchema} from "../src/schemas/items";
import {auditColors,colorFormat} from "./armor-color-audit";
test("color audit distinguishes exact RGB shapes without granting semantics",()=>{
 for(const value of ["3,252,248","255,0,0","0,0,0"])assert.equal(colorFormat(value),"RGB_DECIMAL_TRIPLET");
 for(const value of ["256,0,0","-1,0,0","1, 2,3","1,2","01,2,3","#ffffff",null,123,{}])assert.notEqual(colorFormat(value),"RGB_DECIMAL_TRIPLET");
});
test("color audit preserves raw facts and separates missing-field gameplay lore",()=>{
 const a=ItemDefinitionSchema.parse({id:"ANY",name:"Any",category:"HELMET",metadata:{color:"3,252,248",dyeState:1}});
 const b=ItemDefinitionSchema.parse({id:"OTHER",name:"Other",category:"LEGGINGS",knowledge:{rawLore:["Same color = 2x stats!"]}});
 const before=JSON.stringify([a,b]),r=auditColors([a,b]);
 assert.equal(r.summary.withColor,1);assert.equal(r.summary.armorWithColor,1);assert.equal(r.colorLore[0].color,null);
 assert.deepEqual(r.rows[0].relatedFields,a.metadata);assert.equal(JSON.stringify([a,b]),before);
 assert.deepEqual(auditColors([b,a]),r);
});
test("non-Armor and malformed values remain explicit in corpus totals",()=>{
 const a=ItemDefinitionSchema.parse({id:"A",name:"A",metadata:{color:42}});
 const b=ItemDefinitionSchema.parse({id:"B",name:"B",category:"BOOTS",metadata:{color:"999,0,0"}});
 const r=auditColors([a,b]);assert.equal(r.summary.nonArmorWithColor,1);assert.equal(r.summary.unexpectedCases,2);
 assert.deepEqual(r.summary.valueTypes,{number:1,string:1});
});
