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
      <div className="mx-auto mt-28 flex w-full flex-col items-center sm:mt-40">
        <div className="flex w-10/12 max-w-5xl flex-col items-center justify-center gap-y-8">
          <h1 className="font-reimbrandt text-4xl sm:text-7xl">
            {props.title}
          </h1>
          {props.subtitle}
        </div>

        <div className="w-10/12 sm:w-8/12">{props.children}</div>
      </div>
    </section>
  );
}
