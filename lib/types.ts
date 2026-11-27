export type Sport="football"|"basketball"|"tennis"|"handball"|"volleyball";
export type Match={id:string;sport:Sport;league:string;home:string;away:string;kickoff:string;state:"pre"|"live"|"post"|"void";score?:[number,number];probs?:{h:number;d:number;a:number};source:string;sample?:boolean};
