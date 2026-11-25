import { Workflow } from "lucide-react";
import { publicIdentity } from "@/lib/platform-identity";
export async function Brand() {
  const {name} = await publicIdentity();
  return <span className="brand"><span className="brand-icon"><Workflow size={22} /></span>{name}</span>;
}
