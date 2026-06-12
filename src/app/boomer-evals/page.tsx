import { BoomerEvalsClient, type GibberishSummary, type DatasetItem } from "./BoomerEvalsClient";
import summaryData from "./data/summary.json";
import datasetData from "./data/dataset.json";

export default function BoomerEvalsPage() {
  const summary = summaryData as unknown as GibberishSummary;
  const dataset = datasetData as unknown as { items: DatasetItem[] };

  return <BoomerEvalsClient summary={summary} datasetItems={dataset.items} />;
}
