import { useEffect, useState } from "react";
import styled from "styled-components";
import { storeEnabled, fetchPricing, startCheckout, consumeCheckoutResult } from "./checkout";

const breakpoints = { largeTablet: "900px" };

const OrderDiv = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 20px;

  h2, p {
    padding: 0;
    margin: 0;
  }
  h2 {
    color: ${({ theme }) => theme.colors.headerPrimary};
  }
  p {
    color: ${({ theme }) => theme.colors.headerSecondary};
    padding-bottom: 20px;
    font-size: 14px;
    line-height: 1.3;
  }

  @media (max-width: ${breakpoints.largeTablet}) {
    border-top: 4px solid ${({ theme }) => theme.colors.outline};
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  color: ${({ theme }) => theme.colors.headerSecondary};
  font-size: 14px;
`;

const Price = styled.span`
  color: ${({ theme }) => theme.colors.headerPrimary};
  font-size: 20px;
  font-weight: 600;
`;

const QuantityInput = styled.input`
  width: 56px;
  padding: 5px;
  font-size: 14px;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.headerPrimary};
`;

const BuyButton = styled.button`
  padding: 8px 16px;
  font-size: 14px;
  width: 150px;
  background-color: ${({ theme }) => theme.colors.highlightPrimary};
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;

  &:hover:enabled {
    background-color: ${({ theme }) => theme.colors.highlightSecondary};
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const Notice = styled.p`
  &&& {
    color: ${({ $tone, theme }) => ($tone === "error" ? "#ff7b7b" : $tone === "success" ? "#7bd88f" : theme.colors.headerSecondary)};
  }
`;

const money = (cents) => `$${(cents / 100).toFixed(2)}`;

// Order panel: price from the API, quantity, and the Buy button that hands off
// to Stripe Checkout. Shows the outcome banner when Stripe redirects back.
const OrderPanel = ({ modelConfig, stlURL }) => {
  const [pricing, setPricing] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const result = consumeCheckoutResult();
    if (result === "success") {
      setNotice({ tone: "success", text: "Thanks for your order! A receipt is on its way to your email, and tracking follows once it ships." });
    } else if (result === "cancel") {
      setNotice({ tone: "info", text: "Checkout cancelled. Your design is still here whenever you're ready." });
    }
    if (!storeEnabled) return;
    fetchPricing()
      .then(setPricing)
      .catch((err) => console.warn("pricing unavailable", err));
  }, []);

  const buy = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const url = await startCheckout({ modelConfig, quantity, stlURL });
      window.location.assign(url);
    } catch (err) {
      setNotice({ tone: "error", text: `Could not start checkout: ${err.message}` });
      setBusy(false);
    }
  };

  if (!storeEnabled) {
    return (
      <OrderDiv>
        <h2>Order</h2>
        <p>Printed and shipped to you (Coming Soon)</p>
      </OrderDiv>
    );
  }

  return (
    <OrderDiv>
      <h2>Order</h2>
      <p>Printed to your exact specs and shipped to you in the US.</p>
      {notice && <Notice $tone={notice.tone}>{notice.text}</Notice>}
      <Row>
        <Price>{pricing ? money(pricing.unitPriceCents) : "…"}</Price>
        <span>each{pricing ? ` + ${money(pricing.shippingGroundCents)} USPS Ground shipping` : ""}</span>
      </Row>
      <Row>
        <label htmlFor="order-quantity">Quantity</label>
        <QuantityInput
          id="order-quantity"
          type="number"
          min={1}
          max={10}
          value={quantity}
          onChange={(e) => setQuantity(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
        />
        <BuyButton onClick={buy} disabled={busy || !pricing}>
          {busy ? "Redirecting…" : "Buy now"}
        </BuyButton>
      </Row>
    </OrderDiv>
  );
};

export default OrderPanel;
