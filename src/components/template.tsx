import React from "react";
import Navigation from "./home/navigation";

interface ITemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly title: string;
  readonly subtitle?: string | React.ReactNode;
}

export default function Template(props: ITemplateProps) {
  return (
    <section className="min-h-screen bg-dark-green-default pb-40 text-cream-default">
      <Navigation showNav={true} />
      <div className="mx-auto flex w-10/12 flex-col items-center pt-20 sm:px-10 sm:pt-20">
        <div className="flex w-full max-w-5xl flex-col items-center justify-center gap-8 px-0 py-8 pb-4 sm:px-14 sm:py-16">
          <h1 className="font-reimbrandt text-4xl sm:text-9xl">
            {props.title}
          </h1>

          {props.subtitle}
        </div>

        {props.children}
      </div>
    </section>
  );
}
