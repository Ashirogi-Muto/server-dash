import { Shell } from "@/components/layout/Shell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServiceList } from "@/components/services/ServiceList";
import { Zap } from "lucide-react";

export default function ServicesPage() {
    return (
        <Shell>
            <PageHeader
                title="System Services"
                icon={Zap}
                actions={
                    <button className="text-xs text-zinc-400 hover:text-white underline">
                        View Failed Units
                    </button>
                }
            />

            <div className="px-6 pb-8">
                <ServiceList />
            </div>
        </Shell>
    );
}
