import Template from "~/components/template";
import JoinForm from "./join-form";

export default function Page() {
  return (
    <Template
      subtitle="Register yourself as PERKI Aachen fellowship member! ❤️"
      title="Join us"
    >
      <div className="mx-auto mt-4 grid w-full max-w-5xl gap-4 px-0 sm:px-14">
        <JoinForm />
      </div>
    </Template>
  );
}
