import Loader from "~/components/loader";
import Template from "~/components/template";
import { api } from "~/utils/api";

export default function Finance() {
  const { data, isLoading } = api.finances.getFinances.useQuery();

  const filtered = data?.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (t) =>
          t.properties.Description.title.at(0)?.plain_text ===
            item.properties.Description.title.at(0)?.plain_text &&
          t.properties.Amount.number === item.properties.Amount.number,
      ),
  );

  return (
    <Template title="Finance" subtitle="Our family wealth tracker.">
      <div className="">
        <div>unfiltered: {data?.length}</div>
        <div>filtered: {filtered?.length}</div>

        {isLoading && <Loader message="Loading finances ..." />}

        <div className="mt-12 max-h-80 overflow-y-scroll">
          <h1>UNFILTERED</h1>
          {data?.map((x) => (
            <div key={x.id}>
              {x.properties.Date.date?.start} -{" "}
              {x.properties.Description.title.at(0)?.plain_text} -{" "}
              {x.properties.Amount.number}
            </div>
          ))}
        </div>

        <div className="mt-12 max-h-80 overflow-y-scroll">
          <h1>FILTERED</h1>
          {filtered?.map((x) => (
            <div key={x.id}>
              {x.properties.Date.date?.start} -{" "}
              {x.properties.Description.title.at(0)?.plain_text} -{" "}
              {x.properties.Amount.number}
            </div>
          ))}
        </div>
      </div>
    </Template>
  );
}
