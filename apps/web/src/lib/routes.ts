// Detail pages take the id as a query param, not a path segment: the app is a
// static export (it ships inside the Capacitor shell), and ids only exist on
// the device, so there is nothing to pre-render a `[id]` route for.

export const documentHref = (id: string) =>
  `/vault/doc?id=${encodeURIComponent(id)}`;

export const collectionHref = (id: string) =>
  `/collections/view?id=${encodeURIComponent(id)}`;
