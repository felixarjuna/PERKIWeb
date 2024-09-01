import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Template from "~/components/template";
import { Button } from "~/components/ui/button";
import ChangePasswordForm from "./change-password-form";

export default function ChangePassword() {
  const router = useRouter();

  return (
    <Template title="Change Password">
      <div className="mt-8 flex flex-col gap-y-8">
        <Button
          className="flex w-fit gap-x-2 self-end"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <ChangePasswordForm />
      </div>
    </Template>
  );
}
