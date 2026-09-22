import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  PackageMinus,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SIZES, sizeLabel, type Status, type Category, type Color } from "@/data/types";
import { getSession, signOut } from "@/lib/auth";
import { formatEUR } from "@/lib/format";
import * as db from "@/lib/db";
import type { AdminProduct, AdminVariant } from "@/lib/db";
import { uploadProductImage, deleteProductImage } from "@/lib/storage";
import * as ordersDb from "@/lib/orders-db";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "@/lib/orders-db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function toSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy";

const labelCls = "block text-[11px] font-bold uppercase tracking-[0.1em] text-navy mb-1";

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Central Administrativa — Ladyfit" },
      { name: "description", content: "Gestão de produtos, categorias e cores da Ladyfit." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

// ─── Root Component ───────────────────────────────────────────────────────────

function AdminPage() {
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<
    "dashboard" | "pedidos" | "stock" | "clientes" | "produtos" | "categorias" | "cores"
  >("dashboard");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    getSession().then(async (session) => {
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      try {
        const [prods, cats, cols] = await Promise.all([
          db.fetchProducts(),
          db.fetchCategories(),
          db.fetchColors(),
        ]);
        setProducts(prods.map(db.productToAdmin));
        setCategories(cats);
        setColors(cols);
      } catch {
        setLoadError(
          "Erro ao carregar dados do Supabase. Verifique o schema e as variáveis de ambiente.",
        );
      }
      try {
        setOrders(await ordersDb.fetchOrders());
      } catch {
        // Tabelas de pedidos podem ainda não existir — a aba Pedidos mostra
        // a lista vazia e a mensagem de erro aparece apenas ao usá-la.
      }
      setAuthReady(true);
    });
  }, [navigate]);

  if (!authReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">A verificar acesso…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm font-semibold text-destructive">{loadError}</p>
        <button onClick={() => window.location.reload()} className="text-xs text-navy underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  // ── Product handlers ──
  async function handleSaveProduct(updated: AdminProduct) {
    try {
      const saved = await db.upsertProduct(updated);
      setProducts((prev) => {
        const exists = prev.some((p) => p.id === updated.id);
        return exists
          ? prev.map((p) => (p.id === updated.id ? saved : p))
          : prev.map((p) => (p.id === updated.id ? saved : p));
      });
      toast.success("Produto guardado.");
      return saved;
    } catch {
      toast.error("Erro ao guardar produto. Tente novamente.");
      throw new Error("save failed");
    }
  }

  async function handleDeleteProduct(id: string) {
    try {
      await db.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Produto eliminado.");
    } catch {
      toast.error("Erro ao eliminar produto.");
    }
  }

  function handleAddProduct(p: AdminProduct) {
    setProducts((prev) => [p, ...prev]);
  }

  // ── Category handlers ──
  async function handleSaveCategory(c: Category) {
    try {
      await db.upsertCategory(c);
      setCategories((prev) =>
        prev.some((x) => x.id === c.id) ? prev.map((x) => (x.id === c.id ? c : x)) : [...prev, c],
      );
      toast.success("Categoria guardada.");
    } catch {
      toast.error("Erro ao guardar categoria.");
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await db.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Categoria eliminada.");
    } catch {
      toast.error("Erro ao eliminar categoria.");
    }
  }

  // ── Color handlers ──
  async function handleSaveColor(c: Color) {
    try {
      await db.upsertColor(c);
      setColors((prev) =>
        prev.some((x) => x.id === c.id) ? prev.map((x) => (x.id === c.id ? c : x)) : [...prev, c],
      );
      toast.success("Cor guardada.");
    } catch {
      toast.error("Erro ao guardar cor.");
    }
  }

  async function handleDeleteColor(id: string) {
    try {
      await db.deleteColor(id);
      setColors((prev) => prev.filter((c) => c.id !== id));
      toast.success("Cor eliminada.");
    } catch {
      toast.error("Erro ao eliminar cor.");
    }
  }

  // ── Stock adjustment handler ──
  async function handleAdjustStock(variantId: string, delta: number, reason: string) {
    try {
      await ordersDb.adjustVariantStock(variantId, delta, reason);
      const fresh = await db.fetchProducts();
      setProducts(fresh.map(db.productToAdmin));
      toast.success("Stock ajustado.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao ajustar stock.";
      toast.error(msg);
    }
  }

  // ── Order handlers ──
  async function handleCreateOrder(draft: ordersDb.OrderDraft, tempId: number) {
    try {
      const created = await ordersDb.createOrder(draft);
      setOrders((prev) => prev.map((o) => (o.id === tempId ? created : o)));
      toast.success("Pedido criado.");
      return created;
    } catch {
      toast.error("Erro ao criar pedido.");
      return undefined;
    }
  }

  function handleAddDraftOrder(order: Order) {
    setOrders((prev) => [order, ...prev]);
  }

  function handleDiscardDraftOrder(tempId: number) {
    setOrders((prev) => prev.filter((o) => o.id !== tempId));
  }

  async function handleSaveOrderDetails(
    id: number,
    patch: { customerName: string; customerPhone: string; customerEmail: string; notes: string },
  ) {
    try {
      await ordersDb.updateOrderDetails(id, patch);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
      toast.success("Dados do pedido atualizados.");
    } catch {
      toast.error("Erro ao atualizar dados do pedido.");
    }
  }

  async function handleSaveOrderItems(id: number, items: ordersDb.OrderDraft["items"]) {
    try {
      const newItems = await ordersDb.replaceOrderItems(id, items);
      const total = newItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, items: newItems, total } : o)));
      toast.success("Itens do pedido atualizados.");
    } catch {
      toast.error("Erro ao atualizar itens do pedido.");
    }
  }

  async function handleChangeOrderStatus(order: Order, status: OrderStatus, note: string) {
    try {
      await ordersDb.changeOrderStatus(order, status, note);
      const history = await ordersDb.fetchOrderHistory(order.id);
      const stockDeducted = order.stockDeducted || status === "confirmado";
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status, history, stockDeducted } : o)),
      );
      if (status === "confirmado" && !order.stockDeducted) {
        const fresh = await db.fetchProducts();
        setProducts(fresh.map(db.productToAdmin));
      }
      toast.success("Estado do pedido atualizado.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar estado do pedido.";
      toast.error(msg);
    }
  }

  async function handleLoadOrderHistory(id: number) {
    try {
      const history = await ordersDb.fetchOrderHistory(id);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, history } : o)));
    } catch {
      toast.error("Erro ao carregar histórico do pedido.");
    }
  }

  async function handleDeductStock(order: Order) {
    try {
      await ordersDb.deductOrderStock(order);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, stockDeducted: true } : o)));
      const fresh = await db.fetchProducts();
      setProducts(fresh.map(db.productToAdmin));
      toast.success("Baixa de stock efetuada.");
    } catch {
      toast.error("Erro ao dar baixa de stock.");
    }
  }

  async function handleReverseStock(order: Order) {
    try {
      await ordersDb.reverseOrderStock(order);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, stockDeducted: false } : o)),
      );
      const fresh = await db.fetchProducts();
      setProducts(fresh.map(db.productToAdmin));
      toast.success("Reversão de stock efetuada.");
    } catch {
      toast.error("Erro ao reverter stock.");
    }
  }

  async function handleDeleteOrder(id: number) {
    try {
      await ordersDb.deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success("Pedido eliminado.");
    } catch {
      toast.error("Erro ao eliminar pedido.");
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Ladyfit</p>
          <h1 className="mt-2 truncate text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            Central Administrativa
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <Link to="/" className="text-sm font-semibold text-navy hover:text-brand">
            Ver loja
          </Link>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/login" });
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-navy"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-border">
        {(
          [
            ["dashboard", "Dashboard"],
            ["pedidos", "Pedidos"],
            ["stock", "Stocks"],
            ["clientes", "Clientes"],
            ["produtos", "Produtos"],
            ["categorias", "Categoria"],
            ["cores", "Cores"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] ${tab === key ? "border-brand text-brand" : "border-transparent text-muted-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "dashboard" && <DashboardTab orders={orders} products={products} />}
        {tab === "pedidos" && (
          <OrdersTab
            orders={orders}
            products={products}
            colors={colors}
            onAddDraft={handleAddDraftOrder}
            onDiscardDraft={handleDiscardDraftOrder}
            onCreate={handleCreateOrder}
            onSaveDetails={handleSaveOrderDetails}
            onSaveItems={handleSaveOrderItems}
            onChangeStatus={handleChangeOrderStatus}
            onLoadHistory={handleLoadOrderHistory}
            onDeductStock={handleDeductStock}
            onReverseStock={handleReverseStock}
            onDelete={handleDeleteOrder}
          />
        )}
        {tab === "stock" && <StockTab products={products} categories={categories} />}
        {tab === "clientes" && <ClientesTab orders={orders} />}
        {tab === "produtos" && (
          <ProductsTab
            products={products}
            categories={categories}
            colors={colors}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddProduct={handleAddProduct}
            onAdjustStock={handleAdjustStock}
          />
        )}
        {tab === "categorias" && (
          <CategoriesTab
            categories={categories}
            onSave={handleSaveCategory}
            onDelete={handleDeleteCategory}
          />
        )}
        {tab === "cores" && (
          <ColorsTab colors={colors} onSave={handleSaveColor} onDelete={handleDeleteColor} />
        )}
      </div>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

const DASHBOARD_RANGES = [30, 60, 90] as const;
type DashboardRange = (typeof DASHBOARD_RANGES)[number];

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold text-navy">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function DashboardTab({ orders, products }: { orders: Order[]; products: AdminProduct[] }) {
  const [range, setRange] = useState<DashboardRange>(30);

  const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
  const ordersInRange = orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff);
  const nonCancelled = ordersInRange.filter((o) => o.status !== "cancelado");
  const revenue = nonCancelled.reduce((sum, o) => sum + o.total, 0);
  const avgTicket = nonCancelled.length > 0 ? revenue / nonCancelled.length : 0;

  const statusCounts = new Map<OrderStatus, number>();
  for (const o of ordersInRange) statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);

  const productSales = new Map<string, number>();
  for (const o of nonCancelled) {
    for (const item of o.items) {
      productSales.set(item.productName, (productSales.get(item.productName) ?? 0) + item.quantity);
    }
  }
  const topProducts = [...productSales.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const publishedCount = products.filter((p) => p.status === "published").length;
  const totalStockUnits = products.reduce(
    (sum, p) => sum + p.variants.reduce((s, v) => s + v.stock, 0),
    0,
  );
  const lowStockVariants = products.flatMap((p) =>
    p.variants.filter((v) => v.stock > 0 && v.stock <= 3).map((v) => ({ product: p, variant: v })),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Período
        </span>
        {DASHBOARD_RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] ${
              range === r
                ? "border-navy bg-navy text-white"
                : "border-border text-muted-foreground hover:border-navy hover:text-navy"
            }`}
          >
            {r} dias
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard
          label="Vendas (período)"
          value={formatEUR(revenue)}
          sub={`${nonCancelled.length} pedidos`}
        />
        <KpiCard label="Pedidos (período)" value={String(ordersInRange.length)} />
        <KpiCard label="Ticket médio" value={formatEUR(avgTicket)} />
        <KpiCard label="Produtos publicados" value={String(publishedCount)} />
        <KpiCard
          label="Unidades em stock"
          value={String(totalStockUnits)}
          sub={`${lowStockVariants.length} com stock baixo`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Pedidos por status
          </h3>
          {ordersInRange.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem pedidos no período.</p>
          ) : (
            <ul className="space-y-2">
              {ORDER_STATUSES.map((s) => {
                const count = statusCounts.get(s) ?? 0;
                if (count === 0) return null;
                return (
                  <li key={s} className="flex items-center justify-between text-sm">
                    <span className="text-navy">{ORDER_STATUS_LABELS[s]}</span>
                    <span className="font-bold text-navy">{count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Produtos mais vendidos
          </h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem vendas no período.</p>
          ) : (
            <ul className="space-y-2">
              {topProducts.map(([name, qty]) => (
                <li key={name} className="flex items-center justify-between text-sm">
                  <span className="text-navy">{name}</span>
                  <span className="font-bold text-navy">{qty} un.</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {lowStockVariants.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Stock baixo (≤ 3 unidades)
          </h3>
          <ul className="space-y-1.5">
            {lowStockVariants.map(({ product, variant }) => (
              <li key={variant.id} className="flex items-center justify-between text-sm">
                <span className="text-navy">
                  {product.name} — {sizeLabel(variant.size, "pt")}
                </span>
                <span className="font-bold text-brand">{variant.stock} un.</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Stock Tab ────────────────────────────────────────────────────────────────

type StockSortKey = "name" | "stock";

function StockTab({ products, categories }: { products: AdminProduct[]; categories: Category[] }) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState<StockSortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggleSort(key: StockSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const rows = products
    .map((p) => ({
      product: p,
      categoryName: categories.find((c) => c.id === p.categoryId)?.name ?? "—",
      totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
      variantCount: p.variants.length,
    }))
    .filter((r) => !categoryFilter || r.product.categoryId === categoryFilter);

  rows.sort((a, b) => {
    const cmp =
      sortKey === "name"
        ? a.product.name.localeCompare(b.product.name)
        : a.totalStock - b.totalStock;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const sortIndicator = (key: StockSortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Categoria
        </label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={`${inputCls} w-auto`}
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead className="bg-soft">
            <tr className="text-[11px] uppercase tracking-[0.1em] text-navy">
              <th className="px-3 py-3 font-bold">Foto</th>
              <th
                className="cursor-pointer select-none px-3 py-3 font-bold hover:text-brand"
                onClick={() => toggleSort("name")}
              >
                Produto{sortIndicator("name")}
              </th>
              <th className="px-3 py-3 font-bold">Categoria</th>
              <th className="px-3 py-3 font-bold">Variantes</th>
              <th
                className="cursor-pointer select-none px-3 py-3 font-bold hover:text-brand"
                onClick={() => toggleSort("stock")}
              >
                Stock total{sortIndicator("stock")}
              </th>
              <th className="px-3 py-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product, categoryName, totalStock, variantCount }) => (
              <tr key={product.id} className="border-t border-border">
                <td className="px-3 py-2">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      className="h-14 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-14 w-10 rounded bg-soft" />
                  )}
                </td>
                <td className="px-3 py-2 text-sm font-semibold text-navy">{product.name}</td>
                <td className="px-3 py-2 text-sm text-muted-foreground">{categoryName}</td>
                <td className="px-3 py-2 text-sm text-muted-foreground">{variantCount}</td>
                <td className="px-3 py-2">
                  <span
                    className={`text-sm font-bold ${totalStock === 0 ? "text-destructive" : totalStock <= 3 ? "text-brand" : "text-navy"}`}
                  >
                    {totalStock}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${product.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {product.status === "published" ? "Publicado" : "Rascunho"}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Sem produtos para esta categoria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Clientes Tab ─────────────────────────────────────────────────────────────

interface ClienteRow {
  key: string;
  name: string;
  phone: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

type ClienteSortKey = "name" | "orders" | "spent" | "lastOrder";

function ClientesTab({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<ClienteSortKey>("lastOrder");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: ClienteSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const byEmail = new Map<string, ClienteRow>();
  for (const o of orders) {
    const key = o.customerEmail.trim().toLowerCase() || `phone:${o.customerPhone}`;
    if (!key || key === "phone:") continue;
    const existing = byEmail.get(key);
    if (!existing) {
      byEmail.set(key, {
        key,
        name: o.customerName,
        phone: o.customerPhone,
        email: o.customerEmail,
        orderCount: 1,
        totalSpent: o.total,
        lastOrderAt: o.createdAt,
      });
    } else {
      existing.orderCount += 1;
      existing.totalSpent += o.total;
      if (new Date(o.createdAt).getTime() > new Date(existing.lastOrderAt).getTime()) {
        existing.name = o.customerName;
        existing.phone = o.customerPhone;
        existing.lastOrderAt = o.createdAt;
      }
    }
  }

  let rows = [...byEmail.values()];
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q),
    );
  }

  rows.sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    else if (sortKey === "orders") cmp = a.orderCount - b.orderCount;
    else if (sortKey === "spent") cmp = a.totalSpent - b.totalSpent;
    else cmp = new Date(a.lastOrderAt).getTime() - new Date(b.lastOrderAt).getTime();
    return sortDir === "asc" ? cmp : -cmp;
  });

  const sortIndicator = (key: ClienteSortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <div>
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Procurar por nome, telefone ou e-mail"
          className={`${inputCls} max-w-sm`}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead className="bg-soft">
            <tr className="text-[11px] uppercase tracking-[0.1em] text-navy">
              <th
                className="cursor-pointer select-none px-3 py-3 font-bold hover:text-brand"
                onClick={() => toggleSort("name")}
              >
                Cliente{sortIndicator("name")}
              </th>
              <th className="px-3 py-3 font-bold">Telefone</th>
              <th className="px-3 py-3 font-bold">E-mail</th>
              <th
                className="cursor-pointer select-none px-3 py-3 font-bold hover:text-brand"
                onClick={() => toggleSort("orders")}
              >
                Nº pedidos{sortIndicator("orders")}
              </th>
              <th
                className="cursor-pointer select-none px-3 py-3 font-bold hover:text-brand"
                onClick={() => toggleSort("spent")}
              >
                Total{sortIndicator("spent")}
              </th>
              <th
                className="cursor-pointer select-none px-3 py-3 font-bold hover:text-brand"
                onClick={() => toggleSort("lastOrder")}
              >
                Último pedido{sortIndicator("lastOrder")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-border">
                <td className="px-3 py-2 text-sm font-semibold text-navy">{r.name || "—"}</td>
                <td className="px-3 py-2 text-sm text-muted-foreground">{r.phone || "—"}</td>
                <td className="px-3 py-2 text-sm text-muted-foreground">{r.email || "—"}</td>
                <td className="px-3 py-2 text-sm text-navy">{r.orderCount}</td>
                <td className="px-3 py-2 text-sm text-navy">{formatEUR(r.totalSpent)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-sm text-muted-foreground">
                  {formatOrderDate(r.lastOrderAt)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Sem clientes registados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab({
  products,
  categories,
  colors,
  onSaveProduct,
  onDeleteProduct,
  onAddProduct,
  onAdjustStock,
}: {
  products: AdminProduct[];
  categories: Category[];
  colors: Color[];
  onSaveProduct: (p: AdminProduct) => Promise<AdminProduct>;
  onDeleteProduct: (id: string) => void;
  onAddProduct: (p: AdminProduct) => void;
  onAdjustStock: (variantId: string, delta: number, reason: string) => Promise<void>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  function handleAdd() {
    const id = `new-${uid()}`;
    const p: AdminProduct = {
      id,
      slug: "",
      categoryId: categories[0]?.id ?? "",
      name: "Novo produto",
      nameEn: "",
      description: "",
      descriptionEn: "",
      images: [],
      price: 0,
      salePrice: null,
      status: "draft",
      bestseller: false,
      isNew: true,
      variants: [],
    };
    onAddProduct(p);
    setNewIds((s) => new Set(s).add(id));
    setExpandedId(id);
  }

  async function handleSave(updated: AdminProduct): Promise<AdminProduct | undefined> {
    try {
      const saved = await onSaveProduct(updated);
      setNewIds((s) => {
        const n = new Set(s);
        n.delete(updated.id);
        return n;
      });
      setExpandedId(null);
      return saved;
    } catch {
      return undefined;
    }
  }

  function handleDelete(id: string) {
    onDeleteProduct(id);
    setNewIds((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
    if (expandedId === id) setExpandedId(null);
  }

  function handleCancelNew(id: string) {
    onDeleteProduct(id);
    setNewIds((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
    setExpandedId(null);
  }

  return (
    <>
      <div className="mb-4">
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-brand-foreground"
        >
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-soft">
            <tr className="text-[11px] uppercase tracking-[0.1em] text-navy">
              {["", "Foto", "Produto", "Categoria", "Preço", "Status", "Variantes", ""].map(
                (h, i) => (
                  <th key={i} className="whitespace-nowrap px-3 py-3 font-bold">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                expanded={expandedId === product.id}
                onToggle={() => setExpandedId((p) => (p === product.id ? null : product.id))}
                categories={categories}
                colors={colors}
                onSave={handleSave}
                onDelete={() => handleDelete(product.id)}
                isNew={newIds.has(product.id)}
                onCancelNew={() => handleCancelNew(product.id)}
                onAdjustStock={onAdjustStock}
              />
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  Sem produtos. Clique em "Novo produto" para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Product Row ──────────────────────────────────────────────────────────────

function ProductRow({
  product,
  expanded,
  onToggle,
  categories,
  colors,
  onSave,
  onDelete,
  isNew,
  onCancelNew,
  onAdjustStock,
}: {
  product: AdminProduct;
  expanded: boolean;
  onToggle: () => void;
  categories: Category[];
  colors: Color[];
  onSave: (p: AdminProduct) => Promise<AdminProduct | undefined>;
  onDelete: () => void;
  isNew: boolean;
  onCancelNew: () => void;
  onAdjustStock: (variantId: string, delta: number, reason: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<AdminProduct>(product);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stockAdjust, setStockAdjust] = useState<{
    variantId: string;
    delta: string;
    reason: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(product);
  }, [product]);
  useEffect(() => {
    if (isNew && !expanded) onToggle();
  }, [isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  function patch(p: Partial<AdminProduct>) {
    setDraft((d) => ({ ...d, ...p }));
  }
  function patchVariant(id: string, p: Partial<AdminVariant>) {
    setDraft((d) => ({
      ...d,
      variants: d.variants.map((v) => (v.id === id ? { ...v, ...p } : v)),
    }));
  }
  function addVariant() {
    setDraft((d) => ({
      ...d,
      variants: [
        ...d.variants,
        {
          id: `var-${uid()}`,
          colorId: colors[0]?.id ?? "",
          size: "M",
          stock: 0,
          price: d.price,
          salePrice: null,
          status: "draft",
        },
      ],
    }));
  }
  function removeVariant(id: string) {
    setDraft((d) => ({ ...d, variants: d.variants.filter((v) => v.id !== id) }));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        const url = await uploadProductImage(file);
        setDraft((d) => ({ ...d, images: [...d.images, url] }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[upload]", file.name, msg);
        toast.error(`Erro ao fazer upload de "${file.name}": ${msg}`);
      }
    }
    setUploading(false);
    e.target.value = "";
  }

  async function removePhoto(index: number) {
    const url = draft.images[index];
    setDraft((d) => ({ ...d, images: d.images.filter((_, i) => i !== index) }));
    if (url) await deleteProductImage(url).catch(() => {});
  }

  async function handleSave() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  }

  function handleCancel() {
    if (isNew) onCancelNew();
    else {
      setDraft(product);
      onToggle();
    }
  }

  const categoryName = categories.find((c) => c.id === product.categoryId)?.name ?? "—";

  return (
    <Fragment>
      <tr className={`border-t border-border align-middle ${expanded ? "bg-soft/40" : ""}`}>
        <td className="px-2 py-2">
          <button
            onClick={onToggle}
            aria-label={expanded ? "Fechar" : "Editar"}
            className="grid h-7 w-7 place-items-center rounded hover:bg-soft"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-navy" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </td>
        <td className="px-3 py-2">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="h-14 w-10 rounded object-cover"
            />
          ) : (
            <div className="h-14 w-10 rounded bg-soft" />
          )}
        </td>
        <td className="px-3 py-2">
          <p className="text-sm font-semibold text-navy">{product.name}</p>
          <p className="text-[11px] text-muted-foreground">{product.slug || "—"}</p>
        </td>
        <td className="px-3 py-2 text-sm text-muted-foreground">{categoryName}</td>
        <td className="whitespace-nowrap px-3 py-2 text-sm text-navy">
          {product.salePrice ? (
            <>
              <span className="text-brand">{formatEUR(product.salePrice)}</span>
              <span className="ml-1 text-xs line-through text-muted-foreground">
                {formatEUR(product.price)}
              </span>
            </>
          ) : (
            formatEUR(product.price)
          )}
        </td>
        <td className="px-3 py-2">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${product.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
          >
            {product.status === "published" ? "Publicado" : "Rascunho"}
          </span>
        </td>
        <td className="px-3 py-2 text-sm text-muted-foreground">{product.variants.length}</td>
        <td className="px-3 py-2">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-destructive">Eliminar?</span>
              <button
                onClick={onDelete}
                className="rounded bg-destructive px-2 py-1 text-[10px] font-bold uppercase text-white"
              >
                Sim
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded border border-border px-2 py-1 text-[10px] font-bold uppercase"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="grid h-8 w-8 place-items-center rounded hover:bg-soft"
              aria-label="Eliminar"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </button>
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="border-t border-border">
          <td colSpan={8} className="bg-soft/20 px-6 py-6">
            <div className="space-y-6">
              {/* Informações básicas */}
              <Section title="Informações básicas">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Nome (PT)</label>
                    <input
                      className={inputCls}
                      value={draft.name}
                      onChange={(e) => patch({ name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nome (EN)</label>
                    <input
                      className={inputCls}
                      value={draft.nameEn}
                      onChange={(e) => patch({ nameEn: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Descrição (PT)</label>
                    <textarea
                      rows={3}
                      className={inputCls}
                      value={draft.description}
                      onChange={(e) => patch({ description: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Descrição (EN)</label>
                    <textarea
                      rows={3}
                      className={inputCls}
                      value={draft.descriptionEn}
                      onChange={(e) => patch({ descriptionEn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Slug (URL)</label>
                    <input
                      className={inputCls}
                      placeholder={toSlug(draft.name) || "gerado-automaticamente"}
                      value={draft.slug}
                      onChange={(e) => patch({ slug: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Categoria</label>
                    <select
                      className={inputCls}
                      value={draft.categoryId}
                      onChange={(e) => patch({ categoryId: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Preço (€)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className={inputCls}
                      value={draft.price}
                      onChange={(e) => patch({ price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Promoção (€)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className={inputCls}
                      value={draft.salePrice ?? ""}
                      placeholder="Sem promoção"
                      onChange={(e) =>
                        patch({ salePrice: e.target.value === "" ? null : Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Estado</label>
                    <select
                      className={inputCls}
                      value={draft.status}
                      onChange={(e) => patch({ status: e.target.value as Status })}
                    >
                      <option value="draft">Rascunho</option>
                      <option value="published">Publicado</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-6 pt-1">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-navy">
                      <input
                        type="checkbox"
                        checked={draft.bestseller}
                        onChange={(e) => patch({ bestseller: e.target.checked })}
                        className="h-4 w-4 rounded border-border accent-brand"
                      />
                      Mais vendido
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-navy">
                      <input
                        type="checkbox"
                        checked={draft.isNew}
                        onChange={(e) => patch({ isNew: e.target.checked })}
                        className="h-4 w-4 rounded border-border accent-brand"
                      />
                      Novidade
                    </label>
                  </div>
                </div>
              </Section>

              {/* Fotos */}
              <Section title="Fotos">
                <div className="flex flex-wrap gap-3">
                  {draft.images.map((url, i) => (
                    <div key={i} className="group relative h-28 w-20 flex-shrink-0">
                      <img
                        src={url}
                        alt={`Foto ${i + 1}`}
                        className="h-full w-full rounded-md border border-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        aria-label="Remover foto"
                        className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white group-hover:flex"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex h-28 w-20 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border text-muted-foreground hover:border-navy hover:text-navy disabled:opacity-50"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide">
                      {uploading ? "A enviar…" : "Upload"}
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handlePhotoUpload}
                  />
                </div>
                {draft.images.length === 0 && !uploading && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nenhuma foto. Clique em Upload para adicionar.
                  </p>
                )}
              </Section>

              {/* Variantes */}
              <Section title="Variantes">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                        {["Cor", "Tamanho", "Stock", "Preço (€)", "Promoção (€)", "Estado", ""].map(
                          (h, i) => (
                            <th key={i} className="pb-2 pr-3 font-bold">
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {draft.variants.map((v) => (
                        <tr key={v.id} className="border-b border-border/50">
                          <td className="py-1.5 pr-3">
                            <select
                              value={v.colorId}
                              onChange={(e) => patchVariant(v.id, { colorId: e.target.value })}
                              className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-navy"
                            >
                              {colors.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-1.5 pr-3">
                            <select
                              value={v.size}
                              onChange={(e) => patchVariant(v.id, { size: e.target.value })}
                              className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-navy"
                            >
                              {SIZES.map((s) => (
                                <option key={s} value={s}>
                                  {sizeLabel(s, "pt")}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-1.5 pr-3">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={v.stock}
                                onChange={(e) =>
                                  patchVariant(v.id, { stock: Number(e.target.value) })
                                }
                                className="w-16 rounded border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-navy"
                              />
                              {!isNew && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setStockAdjust((s) =>
                                      s?.variantId === v.id
                                        ? null
                                        : { variantId: v.id, delta: "", reason: "" },
                                    )
                                  }
                                  title="Ajustar stock com motivo (auditado)"
                                  className="text-[10px] font-bold uppercase text-navy underline hover:text-brand"
                                >
                                  Ajustar
                                </button>
                              )}
                            </div>
                            {stockAdjust?.variantId === v.id && (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-background p-2">
                                <input
                                  type="number"
                                  placeholder="+/- qtd"
                                  value={stockAdjust.delta}
                                  onChange={(e) =>
                                    setStockAdjust((s) => s && { ...s, delta: e.target.value })
                                  }
                                  className="w-20 rounded border border-border px-2 py-1 text-xs outline-none focus:border-navy"
                                />
                                <input
                                  type="text"
                                  placeholder="Motivo"
                                  value={stockAdjust.reason}
                                  onChange={(e) =>
                                    setStockAdjust((s) => s && { ...s, reason: e.target.value })
                                  }
                                  className="min-w-[120px] flex-1 rounded border border-border px-2 py-1 text-xs outline-none focus:border-navy"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const delta = Number(stockAdjust.delta);
                                    if (!delta || !stockAdjust.reason.trim()) {
                                      toast.error("Indique a quantidade e o motivo do ajuste.");
                                      return;
                                    }
                                    await onAdjustStock(v.id, delta, stockAdjust.reason.trim());
                                    setStockAdjust(null);
                                  }}
                                  className="rounded bg-navy px-2.5 py-1 text-[10px] font-bold uppercase text-white"
                                >
                                  Aplicar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setStockAdjust(null)}
                                  className="rounded border border-border px-2.5 py-1 text-[10px] font-bold uppercase text-muted-foreground"
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-1.5 pr-3">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={v.price}
                              onChange={(e) =>
                                patchVariant(v.id, { price: Number(e.target.value) })
                              }
                              className="w-24 rounded border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-navy"
                            />
                          </td>
                          <td className="py-1.5 pr-3">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={v.salePrice ?? ""}
                              placeholder="—"
                              onChange={(e) =>
                                patchVariant(v.id, {
                                  salePrice: e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                              className="w-24 rounded border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-navy"
                            />
                          </td>
                          <td className="py-1.5 pr-3">
                            <select
                              value={v.status}
                              onChange={(e) =>
                                patchVariant(v.id, { status: e.target.value as Status })
                              }
                              className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-navy"
                            >
                              <option value="draft">Rascunho</option>
                              <option value="published">Publicado</option>
                            </select>
                          </td>
                          <td className="py-1.5">
                            <button
                              type="button"
                              onClick={() => removeVariant(v.id)}
                              className="grid h-7 w-7 place-items-center rounded hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={addVariant}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-brand"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar variante
                </button>
              </Section>

              {/* Actions */}
              <div className="flex items-center gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="rounded-md bg-navy px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "A guardar…" : "Guardar produto"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-md border border-border px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-navy"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab({
  categories,
  onSave,
  onDelete,
}: {
  categories: Category[];
  onSave: (c: Category) => void;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Category | null>(null);
  const [newForm, setNewForm] = useState({ name: "", nameEn: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function startEdit(c: Category) {
    setEditingId(c.id);
    setDraft({ ...c });
  }
  function saveEdit() {
    if (!draft) return;
    onSave({ ...draft, slug: draft.slug || toSlug(draft.name) });
    setEditingId(null);
    setDraft(null);
  }
  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function handleAdd() {
    if (!newForm.name.trim()) return;
    onSave({
      id: `cat-${uid()}`,
      slug: toSlug(newForm.name),
      name: newForm.name.trim(),
      nameEn: newForm.nameEn.trim() || newForm.name.trim(),
    });
    setNewForm({ name: "", nameEn: "" });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-border p-4">
        <h3 className={labelCls}>Nova categoria</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={newForm.name}
            onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nome em português"
            className={`${inputCls} flex-1`}
          />
          <input
            value={newForm.nameEn}
            onChange={(e) => setNewForm((f) => ({ ...f, nameEn: e.target.value }))}
            placeholder="Nome em inglês"
            className={`${inputCls} flex-1`}
          />
          <button
            onClick={handleAdd}
            className="rounded-md bg-navy px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white"
          >
            Adicionar
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead className="bg-soft">
            <tr className="text-[11px] uppercase tracking-[0.1em] text-navy">
              {["Nome (PT)", "Nome (EN)", "Slug", ""].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => {
              const editing = editingId === c.id;
              return (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    {editing && draft ? (
                      <input
                        autoFocus
                        className={inputCls}
                        value={draft.name}
                        onChange={(e) => setDraft((d) => d && { ...d, name: e.target.value })}
                      />
                    ) : (
                      <span className="font-medium text-navy">{c.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing && draft ? (
                      <input
                        className={inputCls}
                        value={draft.nameEn}
                        onChange={(e) => setDraft((d) => d && { ...d, nameEn: e.target.value })}
                      />
                    ) : (
                      <span className="text-muted-foreground">{c.nameEn}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing && draft ? (
                      <input
                        className={inputCls}
                        value={draft.slug}
                        placeholder={toSlug(draft.name)}
                        onChange={(e) => setDraft((d) => d && { ...d, slug: e.target.value })}
                      />
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">{c.slug}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {editing ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="rounded-md bg-navy px-3 py-1.5 text-[10px] font-bold uppercase text-white"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-md border border-border px-3 py-1.5 text-[10px] font-bold uppercase text-muted-foreground"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : confirmDeleteId === c.id ? (
                        <>
                          <span className="text-xs text-destructive">Eliminar?</span>
                          <button
                            onClick={() => {
                              onDelete(c.id);
                              setConfirmDeleteId(null);
                            }}
                            className="rounded bg-destructive px-2 py-1 text-[10px] font-bold uppercase text-white"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded border border-border px-2 py-1 text-[10px] font-bold uppercase"
                          >
                            Não
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(c)}
                            className="grid h-8 w-8 place-items-center rounded hover:bg-soft"
                          >
                            <Pencil className="h-3.5 w-3.5 text-navy" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(c.id)}
                            className="grid h-8 w-8 place-items-center rounded hover:bg-soft"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  Sem categorias.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Colors Tab ───────────────────────────────────────────────────────────────

function ColorsTab({
  colors,
  onSave,
  onDelete,
}: {
  colors: Color[];
  onSave: (c: Color) => void;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Color | null>(null);
  const [newForm, setNewForm] = useState({ name: "", nameEn: "", hex: "#111318" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function startEdit(c: Color) {
    setEditingId(c.id);
    setDraft({ ...c });
  }
  function saveEdit() {
    if (!draft) return;
    onSave(draft);
    setEditingId(null);
    setDraft(null);
  }
  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function handleAdd() {
    if (!newForm.name.trim()) return;
    onSave({
      id: `col-${uid()}`,
      name: newForm.name.trim(),
      nameEn: newForm.nameEn.trim() || newForm.name.trim(),
      hex: newForm.hex,
    });
    setNewForm({ name: "", nameEn: "", hex: "#111318" });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-border p-4">
        <h3 className={labelCls}>Nova cor</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={newForm.name}
            onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nome em português"
            className={`${inputCls} flex-1`}
          />
          <input
            value={newForm.nameEn}
            onChange={(e) => setNewForm((f) => ({ ...f, nameEn: e.target.value }))}
            placeholder="Nome em inglês"
            className={`${inputCls} flex-1`}
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newForm.hex}
              onChange={(e) => setNewForm((f) => ({ ...f, hex: e.target.value }))}
              className="h-10 w-14 cursor-pointer rounded-md border border-border p-0.5"
              aria-label="Cor"
            />
            <span className="font-mono text-xs text-muted-foreground">{newForm.hex}</span>
          </div>
          <button
            onClick={handleAdd}
            className="rounded-md bg-navy px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white"
          >
            Adicionar
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead className="bg-soft">
            <tr className="text-[11px] uppercase tracking-[0.1em] text-navy">
              {["Cor", "Nome (PT)", "Nome (EN)", "Hex", ""].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colors.map((c) => {
              const editing = editingId === c.id;
              return (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    {editing && draft ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={draft.hex}
                          onChange={(e) => setDraft((d) => d && { ...d, hex: e.target.value })}
                          className="h-8 w-10 cursor-pointer rounded border border-border p-0.5"
                        />
                        <span className="font-mono text-xs text-muted-foreground">{draft.hex}</span>
                      </div>
                    ) : (
                      <span
                        className="inline-block h-7 w-7 rounded-full border border-border"
                        style={{ backgroundColor: c.hex }}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing && draft ? (
                      <input
                        autoFocus
                        className={inputCls}
                        value={draft.name}
                        onChange={(e) => setDraft((d) => d && { ...d, name: e.target.value })}
                      />
                    ) : (
                      <span className="font-medium text-navy">{c.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing && draft ? (
                      <input
                        className={inputCls}
                        value={draft.nameEn}
                        onChange={(e) => setDraft((d) => d && { ...d, nameEn: e.target.value })}
                      />
                    ) : (
                      <span className="text-muted-foreground">{c.nameEn}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground">{c.hex}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {editing ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="rounded-md bg-navy px-3 py-1.5 text-[10px] font-bold uppercase text-white"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-md border border-border px-3 py-1.5 text-[10px] font-bold uppercase text-muted-foreground"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : confirmDeleteId === c.id ? (
                        <>
                          <span className="text-xs text-destructive">Eliminar?</span>
                          <button
                            onClick={() => {
                              onDelete(c.id);
                              setConfirmDeleteId(null);
                            }}
                            className="rounded bg-destructive px-2 py-1 text-[10px] font-bold uppercase text-white"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded border border-border px-2 py-1 text-[10px] font-bold uppercase"
                          >
                            Não
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(c)}
                            className="grid h-8 w-8 place-items-center rounded hover:bg-soft"
                          >
                            <Pencil className="h-3.5 w-3.5 text-navy" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(c.id)}
                            className="grid h-8 w-8 place-items-center rounded hover:bg-soft"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {colors.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Sem cores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  whatsapp_iniciado: "bg-amber-100 text-amber-700",
  em_negociacao: "bg-yellow-100 text-yellow-700",
  confirmado: "bg-blue-100 text-blue-700",
  pago: "bg-emerald-100 text-emerald-700",
  enviado: "bg-indigo-100 text-indigo-700",
  concluido: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

function OrdersTab({
  orders,
  products,
  colors,
  onAddDraft,
  onDiscardDraft,
  onCreate,
  onSaveDetails,
  onSaveItems,
  onChangeStatus,
  onLoadHistory,
  onDeductStock,
  onReverseStock,
  onDelete,
}: {
  orders: Order[];
  products: AdminProduct[];
  colors: Color[];
  onAddDraft: (order: Order) => void;
  onDiscardDraft: (tempId: number) => void;
  onCreate: (draft: ordersDb.OrderDraft, tempId: number) => Promise<Order | undefined>;
  onSaveDetails: (
    id: number,
    patch: { customerName: string; customerPhone: string; customerEmail: string; notes: string },
  ) => Promise<void>;
  onSaveItems: (id: number, items: ordersDb.OrderDraft["items"]) => Promise<void>;
  onChangeStatus: (order: Order, status: OrderStatus, note: string) => Promise<void>;
  onLoadHistory: (id: number) => Promise<void>;
  onDeductStock: (order: Order) => Promise<void>;
  onReverseStock: (order: Order) => Promise<void>;
  onDelete: (id: number) => void;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [draftIds, setDraftIds] = useState<Set<number>>(new Set());

  function handleAdd() {
    const tempId = -Date.now();
    const order: Order = {
      id: tempId,
      orderNumber: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      total: 0,
      status: "whatsapp_iniciado",
      notes: "",
      stockDeducted: false,
      items: [],
      history: [],
    };
    onAddDraft(order);
    setDraftIds((s) => new Set(s).add(tempId));
    setExpandedId(tempId);
  }

  function handleDiscard(tempId: number) {
    onDiscardDraft(tempId);
    setDraftIds((s) => {
      const n = new Set(s);
      n.delete(tempId);
      return n;
    });
    setExpandedId(null);
  }

  async function handleCreateSubmit(draft: ordersDb.OrderDraft, tempId: number) {
    const created = await onCreate(draft, tempId);
    if (created) {
      setDraftIds((s) => {
        const n = new Set(s);
        n.delete(tempId);
        return n;
      });
      setExpandedId(created.id);
    }
    return created;
  }

  return (
    <>
      <div className="mb-4">
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-brand-foreground"
        >
          <Plus className="h-4 w-4" /> Novo pedido
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="bg-soft">
            <tr className="text-[11px] uppercase tracking-[0.1em] text-navy">
              {["", "Número", "Data", "Cliente", "Telefone", "E-mail", "Total", "Status", ""].map(
                (h, i) => (
                  <th key={i} className="whitespace-nowrap px-3 py-3 font-bold">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                expanded={expandedId === order.id}
                onToggle={() => {
                  const next = expandedId === order.id ? null : order.id;
                  setExpandedId(next);
                  if (next !== null && !draftIds.has(order.id)) onLoadHistory(order.id);
                }}
                products={products}
                colors={colors}
                isDraft={draftIds.has(order.id)}
                onDiscardDraft={() => handleDiscard(order.id)}
                onCreate={(draft) => handleCreateSubmit(draft, order.id)}
                onSaveDetails={onSaveDetails}
                onSaveItems={onSaveItems}
                onChangeStatus={onChangeStatus}
                onDeductStock={onDeductStock}
                onReverseStock={onReverseStock}
                onDelete={() => onDelete(order.id)}
              />
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  Sem pedidos. Clique em "Novo pedido" para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Order Row ────────────────────────────────────────────────────────────────

interface DraftOrderItem {
  key: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

function itemsToDraft(items: OrderItem[]): DraftOrderItem[] {
  return items.map((i) => ({
    key: i.id,
    productId: i.productId,
    variantId: i.variantId,
    productName: i.productName,
    color: i.color,
    size: i.size,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
  }));
}

function OrderRow({
  order,
  expanded,
  onToggle,
  products,
  colors,
  isDraft,
  onDiscardDraft,
  onCreate,
  onSaveDetails,
  onSaveItems,
  onChangeStatus,
  onDeductStock,
  onReverseStock,
  onDelete,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  products: AdminProduct[];
  colors: Color[];
  isDraft: boolean;
  onDiscardDraft: () => void;
  onCreate: (draft: ordersDb.OrderDraft) => Promise<Order | undefined>;
  onSaveDetails: (
    id: number,
    patch: { customerName: string; customerPhone: string; customerEmail: string; notes: string },
  ) => Promise<void>;
  onSaveItems: (id: number, items: ordersDb.OrderDraft["items"]) => Promise<void>;
  onChangeStatus: (order: Order, status: OrderStatus, note: string) => Promise<void>;
  onDeductStock: (order: Order) => Promise<void>;
  onReverseStock: (order: Order) => Promise<void>;
  onDelete: () => void;
}) {
  const [customer, setCustomer] = useState({
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
  });
  const [notes, setNotes] = useState(order.notes);
  const [items, setItems] = useState<DraftOrderItem[]>(itemsToDraft(order.items));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusForm, setStatusForm] = useState<{ status: OrderStatus; note: string }>({
    status: order.status,
    note: "",
  });

  useEffect(() => {
    setCustomer({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
    });
    setNotes(order.notes);
    setItems(itemsToDraft(order.items));
    setStatusForm({ status: order.status, note: "" });
  }, [
    order.customerName,
    order.customerPhone,
    order.customerEmail,
    order.notes,
    order.items,
    order.status,
  ]);

  function addItem() {
    const firstProduct = products[0];
    const firstVariant = firstProduct?.variants[0];
    setItems((prev) => [
      ...prev,
      {
        key: `tmp-${Date.now()}-${prev.length}`,
        productId: firstProduct?.id ?? null,
        variantId: firstVariant?.id ?? null,
        productName: firstProduct?.name ?? "",
        color: firstVariant ? (colors.find((c) => c.id === firstVariant.colorId)?.name ?? "") : "",
        size: firstVariant?.size ?? "",
        quantity: 1,
        unitPrice: firstVariant?.salePrice ?? firstVariant?.price ?? firstProduct?.price ?? 0,
      },
    ]);
  }

  function updateItemProduct(key: string, productId: string) {
    const product = products.find((p) => p.id === productId);
    const variant = product?.variants[0];
    setItems((prev) =>
      prev.map((it) =>
        it.key === key
          ? {
              ...it,
              productId,
              productName: product?.name ?? "",
              variantId: variant?.id ?? null,
              color: variant ? (colors.find((c) => c.id === variant.colorId)?.name ?? "") : "",
              size: variant?.size ?? "",
              unitPrice: variant?.salePrice ?? variant?.price ?? product?.price ?? 0,
            }
          : it,
      ),
    );
  }

  function updateItemVariant(key: string, productId: string, variantId: string) {
    const product = products.find((p) => p.id === productId);
    const variant = product?.variants.find((v) => v.id === variantId);
    setItems((prev) =>
      prev.map((it) =>
        it.key === key
          ? {
              ...it,
              variantId,
              color: variant ? (colors.find((c) => c.id === variant.colorId)?.name ?? "") : "",
              size: variant?.size ?? "",
              unitPrice: variant?.salePrice ?? variant?.price ?? it.unitPrice,
            }
          : it,
      ),
    );
  }

  function patchItem(key: string, patch: Partial<DraftOrderItem>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  function toOrderDraftItems(): ordersDb.OrderDraft["items"] {
    return items.map((it) => ({
      productId: it.productId,
      variantId: it.variantId,
      productName: it.productName,
      color: it.color,
      size: it.size,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    }));
  }

  async function handleCreate() {
    if (!customer.customerName || !customer.customerPhone || !customer.customerEmail) {
      toast.error("Preencha nome, telefone e e-mail do cliente.");
      return;
    }
    setSaving(true);
    await onCreate({ ...customer, notes, items: toOrderDraftItems() });
    setSaving(false);
  }

  async function handleSaveDetails() {
    setSaving(true);
    await onSaveDetails(order.id, { ...customer, notes });
    setSaving(false);
  }

  async function handleSaveItemsClick() {
    setSaving(true);
    await onSaveItems(order.id, toOrderDraftItems());
    setSaving(false);
  }

  async function handleStatusSubmit() {
    setSaving(true);
    await onChangeStatus(order, statusForm.status, statusForm.note);
    setStatusForm((f) => ({ ...f, note: "" }));
    setSaving(false);
  }

  const itemsTotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  return (
    <Fragment>
      <tr className={`border-t border-border align-middle ${expanded ? "bg-soft/40" : ""}`}>
        <td className="px-2 py-2">
          <button
            onClick={onToggle}
            aria-label={expanded ? "Fechar" : "Editar"}
            className="grid h-7 w-7 place-items-center rounded hover:bg-soft"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-navy" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </td>
        <td className="px-3 py-2 text-sm font-semibold text-navy">
          {isDraft ? "Novo" : order.orderNumber}
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-sm text-muted-foreground">
          {formatOrderDate(order.createdAt)}
        </td>
        <td className="px-3 py-2 text-sm text-navy">{order.customerName || "—"}</td>
        <td className="px-3 py-2 text-sm text-muted-foreground">{order.customerPhone || "—"}</td>
        <td className="px-3 py-2 text-sm text-muted-foreground">{order.customerEmail || "—"}</td>
        <td className="whitespace-nowrap px-3 py-2 text-sm text-navy">{formatEUR(order.total)}</td>
        <td className="px-3 py-2">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ORDER_STATUS_BADGE[order.status]}`}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </td>
        <td className="px-3 py-2">
          {!isDraft &&
            (confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">Eliminar?</span>
                <button
                  onClick={onDelete}
                  className="rounded bg-destructive px-2 py-1 text-[10px] font-bold uppercase text-white"
                >
                  Sim
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded border border-border px-2 py-1 text-[10px] font-bold uppercase"
                >
                  Não
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="grid h-8 w-8 place-items-center rounded hover:bg-soft"
                aria-label="Eliminar"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            ))}
        </td>
      </tr>

      {expanded && (
        <tr className="border-t border-border">
          <td colSpan={9} className="bg-soft/20 px-6 py-6">
            <div className="space-y-6">
              {/* Dados do comprador */}
              <Section title="Dados do comprador">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className={labelCls}>Nome</label>
                    <input
                      className={inputCls}
                      value={customer.customerName}
                      onChange={(e) => setCustomer((c) => ({ ...c, customerName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Telefone</label>
                    <input
                      className={inputCls}
                      value={customer.customerPhone}
                      onChange={(e) =>
                        setCustomer((c) => ({ ...c, customerPhone: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>E-mail</label>
                    <input
                      type="email"
                      className={inputCls}
                      value={customer.customerEmail}
                      onChange={(e) =>
                        setCustomer((c) => ({ ...c, customerEmail: e.target.value }))
                      }
                    />
                  </div>
                </div>
                {!isDraft && (
                  <button
                    type="button"
                    onClick={handleSaveDetails}
                    disabled={saving}
                    className="mt-3 rounded-md bg-navy px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
                  >
                    Guardar dados
                  </button>
                )}
              </Section>

              {/* Itens */}
              <Section title="Itens">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                        {["Produto", "Variante", "Qtd", "Preço unit. (€)", "Subtotal", ""].map(
                          (h, i) => (
                            <th key={i} className="pb-2 pr-3 font-bold">
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => {
                        const product = products.find((p) => p.id === it.productId);
                        return (
                          <tr key={it.key} className="border-b border-border/50">
                            <td className="py-1.5 pr-3">
                              <select
                                value={it.productId ?? ""}
                                onChange={(e) => updateItemProduct(it.key, e.target.value)}
                                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-navy"
                              >
                                <option value="">Item avulso</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-1.5 pr-3">
                              {product && product.variants.length > 0 ? (
                                <select
                                  value={it.variantId ?? ""}
                                  onChange={(e) =>
                                    updateItemVariant(it.key, product.id, e.target.value)
                                  }
                                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-navy"
                                >
                                  {product.variants.map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {colors.find((c) => c.id === v.colorId)?.name ?? v.colorId} ·{" "}
                                      {sizeLabel(v.size, "pt")}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-navy"
                                  placeholder="Cor / tamanho"
                                  value={`${it.color}${it.color && it.size ? " · " : ""}${it.size}`}
                                  onChange={(e) => {
                                    const [color = "", size = ""] = e.target.value.split(" · ");
                                    patchItem(it.key, { color, size });
                                  }}
                                />
                              )}
                            </td>
                            <td className="py-1.5 pr-3">
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) =>
                                  patchItem(it.key, {
                                    quantity: Math.max(1, Number(e.target.value)),
                                  })
                                }
                                className="w-16 rounded border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-navy"
                              />
                            </td>
                            <td className="py-1.5 pr-3">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={it.unitPrice}
                                onChange={(e) =>
                                  patchItem(it.key, { unitPrice: Number(e.target.value) })
                                }
                                className="w-24 rounded border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-navy"
                              />
                            </td>
                            <td className="py-1.5 pr-3 text-sm text-navy">
                              {formatEUR(it.quantity * it.unitPrice)}
                            </td>
                            <td className="py-1.5">
                              <button
                                type="button"
                                onClick={() => removeItem(it.key)}
                                className="grid h-7 w-7 place-items-center rounded hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {items.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-4 text-center text-xs text-muted-foreground"
                          >
                            Sem itens.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-brand"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar item
                  </button>
                  <p className="text-sm font-bold text-navy">Total: {formatEUR(itemsTotal)}</p>
                </div>
                {!isDraft && (
                  <button
                    type="button"
                    onClick={handleSaveItemsClick}
                    disabled={saving}
                    className="mt-3 rounded-md bg-navy px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
                  >
                    Guardar itens
                  </button>
                )}
              </Section>

              {!isDraft && (
                <>
                  {/* Histórico */}
                  <Section title="Histórico">
                    {order.history.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sem alterações registadas.</p>
                    ) : (
                      <ul className="space-y-2">
                        {order.history.map((h) => (
                          <li
                            key={h.id}
                            className="rounded-md border border-border px-3 py-2 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold uppercase tracking-wide text-navy">
                                {ORDER_STATUS_LABELS[h.status]}
                              </span>
                              <span className="text-muted-foreground">
                                {formatOrderDate(h.createdAt)}
                              </span>
                            </div>
                            {h.note && <p className="mt-1 text-muted-foreground">{h.note}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>

                  {/* Alteração de status */}
                  <Section title="Alteração de status">
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className={labelCls}>Novo status</label>
                        <select
                          value={statusForm.status}
                          onChange={(e) =>
                            setStatusForm((f) => ({ ...f, status: e.target.value as OrderStatus }))
                          }
                          className={inputCls}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {ORDER_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="min-w-[220px] flex-1">
                        <label className={labelCls}>Nota (opcional)</label>
                        <input
                          className={inputCls}
                          value={statusForm.note}
                          onChange={(e) => setStatusForm((f) => ({ ...f, note: e.target.value }))}
                          placeholder="Ex.: pagamento confirmado via MB Way"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleStatusSubmit}
                        disabled={saving}
                        className="rounded-md bg-navy px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
                      >
                        Registar alteração
                      </button>
                    </div>
                  </Section>

                  {/* Notas */}
                  <Section title="Notas">
                    <textarea
                      rows={3}
                      className={inputCls}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notas internas sobre o pedido"
                    />
                    <button
                      type="button"
                      onClick={handleSaveDetails}
                      disabled={saving}
                      className="mt-3 rounded-md border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-navy disabled:opacity-60"
                    >
                      Guardar notas
                    </button>
                  </Section>

                  {/* Stock */}
                  <Section title="Stock">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs text-muted-foreground">
                        {order.stockDeducted
                          ? "Stock já foi debitado para este pedido."
                          : "Stock ainda não foi debitado."}
                      </p>
                      {!order.stockDeducted ? (
                        <button
                          type="button"
                          onClick={() => onDeductStock(order)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-navy px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white"
                        >
                          <PackageMinus className="h-3.5 w-3.5" /> Dar baixa de stock
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onReverseStock(order)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-navy"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Reverter baixa
                        </button>
                      )}
                    </div>
                  </Section>
                </>
              )}

              {isDraft && (
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={saving}
                    className="rounded-md bg-navy px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {saving ? "A criar…" : "Criar pedido"}
                  </button>
                  <button
                    type="button"
                    onClick={onDiscardDraft}
                    className="rounded-md border border-border px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-navy"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}
