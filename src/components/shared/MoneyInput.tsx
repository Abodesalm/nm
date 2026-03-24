"use client";

import { useEffect, useState } from "react";

interface MoneyValue {
  USD: number;
  SP: number;
  exchange: number;
}

interface Props {
  value: MoneyValue;
  onChange: (value: MoneyValue) => void;
  defaultExchange?: number;
}

const inputStyle: React.CSSProperties = {
  height: 40,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 13.5,
  fontFamily: "'Tajawal', sans-serif",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s",
};

export function MoneyInput({
  value,
  onChange,
  defaultExchange = 15000,
}: Props) {
  const [usd, setUsd] = useState(value.USD ? String(value.USD) : "");
  const [sp, setSp] = useState(value.SP ? String(value.SP) : "");
  const [exchange, setExchange] = useState(
    value.exchange ? String(value.exchange) : String(defaultExchange),
  );

  useEffect(() => {
    setUsd(value.USD ? String(value.USD) : "");
    setSp(value.SP ? String(value.SP) : "");
    setExchange(
      value.exchange ? String(value.exchange) : String(defaultExchange),
    );
  }, []);

  function handleUsdChange(val: string) {
    setUsd(val);
    const ex = parseFloat(exchange) || defaultExchange;
    const spVal = val ? (parseFloat(val) * ex).toFixed(1) : "";
    setSp(spVal);
    onChange({
      USD: parseFloat(val) || 0,
      SP: parseFloat(spVal) || 0,
      exchange: ex,
    });
  }

  function handleSpChange(val: string) {
    setSp(val);
    const ex = parseFloat(exchange) || defaultExchange;
    const usdVal = val ? (parseFloat(val) / ex).toFixed(2) : "";
    setUsd(usdVal);
    onChange({
      USD: parseFloat(usdVal) || 0,
      SP: parseFloat(val) || 0,
      exchange: ex,
    });
  }

  function handleExchangeChange(val: string) {
    setExchange(val);
    const ex = parseFloat(val) || defaultExchange;
    if (usd) {
      const spVal = (parseFloat(usd) * ex).toFixed(1);
      setSp(spVal);
      onChange({ USD: parseFloat(usd), SP: parseFloat(spVal), exchange: ex });
    } else if (sp) {
      const usdVal = (parseFloat(sp) / ex).toFixed(2);
      setUsd(usdVal);
      onChange({ USD: parseFloat(usdVal), SP: parseFloat(sp), exchange: ex });
    } else {
      onChange({ USD: 0, SP: 0, exchange: ex });
    }
  }

  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}
    >
      {[
        {
          label: "USD",
          value: usd,
          onChange: handleUsdChange,
          placeholder: "0.00",
        },
        {
          label: "ل.س",
          value: sp,
          onChange: handleSpChange,
          placeholder: "0.0",
        },
        {
          label: "سعر الصرف",
          value: exchange,
          onChange: handleExchangeChange,
          placeholder: String(defaultExchange),
        },
      ].map(({ label, value: val, onChange: onCh, placeholder }) => (
        <div
          key={label}
          style={{ display: "flex", flexDirection: "column", gap: 5 }}
        >
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            {label}
          </label>
          <input
            style={inputStyle}
            type="number"
            placeholder={placeholder}
            value={val}
            onChange={(e) => onCh(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
      ))}
    </div>
  );
}
