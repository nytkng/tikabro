import {redirect} from "next/navigation";
export default async function P({params}:{params:Promise<{code:string}>}){const c=(await params).code;redirect(`/poll/${/^\d{4}$/.test(c)?c:""}`)}
