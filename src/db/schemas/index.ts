export * from "./analytics";
export * from "./app";
export * from "./catalog";
export * from "./ingest";
export * from "./resolution";

import * as analytics from "./analytics";
import * as app from "./app";
import * as catalog from "./catalog";
import * as ingest from "./ingest";
import * as resolution from "./resolution";

export const schema = {
  ...analytics,
  ...app,
  ...catalog,
  ...ingest,
  ...resolution,
};
