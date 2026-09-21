import React from "react";
import { Helmet } from "react-helmet-async";
import { SiteShell } from "../components/site/SiteShell";
import  FinancePrintShop from "../pages/finance";

export function FinancePrintShopPage(): React.ReactElement {
  return (
    <>
      <Helmet>
        <title>Finance and Print Shop — Lumen Media</title>
        <meta
          name="description"
          content="Faithful stewardship of ministry resources and in-house printing operations."
        />
      </Helmet>
      <SiteShell>
        <FinancePrintShop />
      </SiteShell>
    </>
  );
}

export default FinancePrintShopPage;