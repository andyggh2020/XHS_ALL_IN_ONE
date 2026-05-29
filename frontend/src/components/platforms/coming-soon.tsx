import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

type Props = {
  title?: string;
  description?: string;
};

export function ComingSoonPage({ title = "功能开发中", description = "该功能正在紧锣密鼓地开发中，敬请期待！" }: Props) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="text-6xl mb-6">🚧</div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-md">{description}</p>
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} className="mr-1.5" />
        返回
      </Button>
    </div>
  );
}
