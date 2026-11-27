import type {Match} from "./types";
// بيانات تجريبية معلّمة بوضوح. تظهر فقط إذا تعذّر الوصول لمصدر البيانات.
export const sample=(date:string):Match[]=>[
 {id:"s1",sport:"football",league:"دوري تجريبي",home:"الفريق الأول",away:"الفريق الثاني",kickoff:date+"T19:00:00Z",state:"pre",probs:{h:48,d:27,a:25},source:"sample",sample:true},
 {id:"s2",sport:"football",league:"دوري تجريبي",home:"الفريق الثالث",away:"الفريق الرابع",kickoff:date+"T20:30:00Z",state:"pre",probs:{h:35,d:30,a:35},source:"sample",sample:true},
 {id:"s3",sport:"basketball",league:"دوري تجريبي",home:"الفريق الخامس",away:"الفريق السادس",kickoff:date+"T22:00:00Z",state:"pre",probs:{h:58,d:0,a:42},source:"sample",sample:true},
];
