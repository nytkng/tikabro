import type {MetadataRoute} from "next";
export default function manifest():MetadataRoute.Manifest{
  return{name:"هدف",short_name:"هدف",dir:"rtl",lang:"ar",start_url:"/",display:"standalone",theme_color:"#0B0D14",background_color:"#0B0D14",
    icons:[
      {src:"/icons/icon-192.png",sizes:"192x192",type:"image/png",purpose:"any"},
      {src:"/icons/icon-512.png",sizes:"512x512",type:"image/png",purpose:"any"},
      {src:"/icons/icon-192-maskable.png",sizes:"192x192",type:"image/png",purpose:"maskable"},
      {src:"/icons/icon-512-maskable.png",sizes:"512x512",type:"image/png",purpose:"maskable"},
    ]};
}
