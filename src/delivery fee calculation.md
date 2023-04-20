place order function

#order type
1)courier -> delivery by post
2)agent -> delivery by khongteen-ecom - delivery partner

# case 1) courier

calculation of delivery charges (per product )

1. find the uniques vendors for all (order) products
2. find the delivery charges of each vendors collection from (1)

delivery charge = delivery charge of the vendor / total order products of the vendor

example
{
vendor:'AAA',
cart_products:'A','B','C',
deliveryFee:100
}
{
vendor:'BBB',
cart_products:'X','Y',
deliveryFee:200
}

delivery fee of each products for vendor 'AAA' = deliveryFee/cart_products = 100/3 = 33.33
delivery of each products for vendor 'BBB' = deliveryFee/cart_products = 100/2 = 50

# case 2) AGENT

calculation of delivery charges (per product )

1. find the delivery partener document by \_id (received from req body)
2. find the uniques vendors for all (order) products
3. find the delivery charges of each vendor from (2)
4. find the common delivery charge from delivery partner (1) and from vendor (2) by

   deliveryCharge =
   deliveryPartnerChargeItem.shipFrom === vendor.addresses[0].city &&
   deliveryPartnerChargeItem.shipTo === cityTo (customer city)

   delivery charge per product = deliveryCharge / no of products from same vendor
