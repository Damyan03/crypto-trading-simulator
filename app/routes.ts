import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/discover.tsx"),
  route("portfolio", "routes/portfolio.tsx"),
  route("trade/:coin", "routes/trade.tsx"),
] satisfies RouteConfig;
