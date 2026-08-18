export const submitPayUCheckout = (payuCheckout) => {
  if (!payuCheckout?.actionUrl || !payuCheckout?.fields) {
    throw new Error("Missing PayU checkout details");
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = payuCheckout.actionUrl;
  form.style.display = "none";

  Object.entries(payuCheckout.fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value ?? "");
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};
