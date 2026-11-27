// النجوم تُحسب أوتوماتيكيا من النتائج المختومة فقط (لا تصويت، لا شراء).
// نستعمل الحد الأدنى لفاصل ثقة Wilson (95%) لنسبة الإصابة، حتى لا يكسب أحد نجوما بحظ عدد قليل من التوقعات.
export function wilsonLB(hits:number,n:number){
  if(n<=0)return 0;const z=1.96,p=hits/n;
  return (p+z*z/(2*n)-z*Math.sqrt((p*(1-p)+z*z/(4*n))/n))/(1+z*z/n);
}
/** 0 = جديد (أقل من 10 توقعات مُسوّاة). 1..5 حسب الجودة والخبرة. الصدفة العشوائية ≈ 33% في كرة القدم. */
export function starsOf(hits:number,n:number){
  if(n<10)return 0;
  const lb=wilsonLB(hits,n);
  let s=lb>=0.55?5:lb>=0.48?4:lb>=0.42?3:lb>=0.36?2:1;
  if(n<25)s=Math.min(s,3);else if(n<50)s=Math.min(s,4); // الخبرة تحتاج عددا
  return s;
}
