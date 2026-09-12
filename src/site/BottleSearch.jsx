import { Fragment, useEffect, useId, useRef, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { search, bottleLabel, bottleId, brandSlug } from "../catalog";

const Wrap = styled.div`
  position: relative;
  width: 100%;
  max-width: ${({ $wide }) => ($wide ? "720px" : "100%")};
`;

const Field = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  min-height: ${({ $large }) => ($large ? "54px" : "44px")};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surface};
  &:focus-within {
    border-color: ${({ theme }) => theme.colors.highlightPrimary};
  }
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  outline: 0;
  color: ${({ theme }) => theme.colors.headerPrimary};
  font-size: ${({ $large }) => ($large ? "17px" : "15px")};
  font-family: inherit;
  &::placeholder {
    color: ${({ theme }) => theme.colors.muted};
  }
`;

const Menu = styled.ul`
  position: absolute;
  z-index: 20;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  margin: 0;
  padding: 6px 0;
  list-style: none;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  max-height: 360px;
  overflow-y: auto;
`;

const Item = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.headerPrimary};
  background: ${({ theme, $active }) => ($active ? theme.colors.surfaceRaised : "transparent")};
  span:last-child {
    color: ${({ theme }) => theme.colors.muted};
    font-size: 13px;
    white-space: nowrap;
  }
`;

const GroupLabel = styled.li`
  padding: 6px 14px 2px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.muted};
`;

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="21" y2="21" />
  </svg>
);

// Typeahead over the bottle database. `onPick(bottle)` handles a bottle
// selection in place; without it, selections navigate to the bottle's brand
// page and sizes to the size page. Enter with no highlighted item runs a full
// search on /find.
export default function BottleSearch({ placeholder, large, wide, onPick, autoFocus, initial = "" }) {
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const listId = useId();

  const results = search(q);
  const items = [
    ...results.sizes.map((h) => ({ kind: "size", key: `size-${h}`, label: `${h} mm bottles`, hint: "size page", go: () => navigate(`/fits/${h}mm/`) })),
    ...results.bottles.map((b) => ({
      kind: "bottle",
      key: bottleId(b),
      label: bottleLabel(b),
      hint: `${b.hole} mm hole`,
      go: () => (onPick ? onPick(b) : navigate(`/fits/${brandSlug(b.brand)}/`)),
    })),
  ];

  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const submit = () => {
    if (active >= 0 && items[active]) {
      items[active].go();
    } else if (q.trim()) {
      navigate(`/find/?q=${encodeURIComponent(q.trim())}`);
    }
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showMenu = open && q.trim().length > 0;

  return (
    <Wrap ref={wrapRef} $wide={wide}>
      <Field $large={large}>
        <SearchIcon />
        <Input
          $large={large}
          type="search"
          role="combobox"
          aria-expanded={showMenu}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder={placeholder || 'Brand, bottle or size: "ScentSplit", "Tom Ford", "19mm"'}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(q !== initial)}
          onKeyDown={onKeyDown}
        />
      </Field>
      {showMenu ? (
        <Menu id={listId} role="listbox">
          {items.length === 0 ? <GroupLabel>No match yet. Press Enter to search everything.</GroupLabel> : null}
          {items.map((it, i) => (
            <Fragment key={it.key}>
              {i === 0 && it.kind === "size" ? <GroupLabel>Sizes</GroupLabel> : null}
              {it.kind === "bottle" && (i === 0 || items[i - 1].kind !== "bottle") ? <GroupLabel>Bottles</GroupLabel> : null}
              <Item
                role="option"
                aria-selected={i === active}
                $active={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  it.go();
                  setOpen(false);
                }}
              >
                <span>{it.label}</span>
                <span>{it.hint}</span>
              </Item>
            </Fragment>
          ))}
        </Menu>
      ) : null}
    </Wrap>
  );
}
