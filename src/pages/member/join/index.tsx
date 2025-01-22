import Template from "~/components/template";
import JoinForm from "./join-form";

export default function Page() {
  return (
    <Template
      title="Join us"
      subtitle="Register yourself as PERKI Aachen fellowship member! ❤️"
    >
      <div className="mx-auto mt-4 grid w-full max-w-5xl gap-4 px-0 sm:px-14">
        <JoinForm />
      </div>
    </Template>
  );
}
