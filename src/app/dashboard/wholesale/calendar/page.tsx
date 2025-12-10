import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import WholesaleCalendarClient from "./WholesaleCalendarClient";

export const dynamic = 'force-dynamic';

export default async function WholesaleCalendarPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard/wholesale/calendar");

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) redirect("/dashboard");

  // Get all wholesale orders for calendar display
  const orders = await prisma.wholesaleOrder.findMany({
    where: { companyId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          recipe: {
            select: {
              id: true,
              name: true,
              yieldQuantity: true,
              yieldUnit: true,
            },
          },
        },
      },
    },
    orderBy: {
      deliveryDate: "asc",
    },
  });

  // Get customers for order creation
  const customers = await prisma.wholesaleCustomer.findMany({
    where: {
      companyId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      deliveryDays: true,
      preferredDeliveryTime: true,
    },
    orderBy: { name: "asc" },
  });

  // Get wholesale products for order items
  const productsRaw = await prisma.wholesaleProduct.findMany({
    where: {
      companyId,
      isActive: true,
    },
    include: {
      recipe: {
        select: {
          id: true,
          name: true,
          yieldQuantity: true,
          yieldUnit: true,
          wholesalePrice: true,
          category: true,
          imageUrl: true,
        },
      },
    },
    orderBy: [
      { sortOrder: "asc" },
      { name: "asc" },
    ],
  });

  const products = productsRaw.map(product => {
    const wholesalePrice = product.price || (product.recipe?.wholesalePrice ? Number(product.recipe.wholesalePrice) : 0);
    return {
      id: product.id,
      recipeId: product.recipeId,
      name: product.name || product.recipe?.name || "Product",
      description: product.description || product.recipe?.description,
      yieldQuantity: product.recipe?.yieldQuantity.toString() || "1",
      yieldUnit: product.recipe?.yieldUnit || "unit",
      unit: product.unit,
      price: wholesalePrice.toString(),
      category: product.category || product.recipe?.category,
      imageUrl: product.imageUrl || product.recipe?.imageUrl,
    };
  });

  return (
    <WholesaleCalendarClient
      orders={orders.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          recipe: {
            ...item.recipe,
            yieldQuantity: item.recipe.yieldQuantity.toString(),
          },
        })),
      }))}
      customers={customers}
      products={products}
      companyId={companyId}
    />
  );
}
