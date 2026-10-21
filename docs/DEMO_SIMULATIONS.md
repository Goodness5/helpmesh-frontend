# What is not live yet

These pieces are not labeled in the product. They are still not a live service.

- Identity check. “Identity checked” is not a completed verification.
- Dispute review. A reported problem stays held. `resolveDispute` in `lib/model.ts` can split an amount in half and is marked `// DEMO-SIMULATED`. The screen does not offer that button.
- Fund eligibility. The app checks the written rules in this browser. It does not ask the eligibility signer.
- Cash out. The button says payouts need a linked account. Nothing is sent.
- Trusted contact. “Text a trusted person” opens the device’s message composer. HelpMesh does not send the text.
- Distances. Seeded distances are examples, not a live location.
- Practice helpers. Daniel and Priya sign from keys kept in this browser, so one person can finish a request. A real helper would use their own device. Their paid transfers are real test-money transactions when demo mode is off.
- Payments. With `NEXT_PUBLIC_DEMO_MODE=false`, reward, fund, tip, and volunteer confirmation use the Base Sepolia contracts. With demo mode on, money stays in this browser and the wallet says “Demo chain”.
- Emergency numbers. The app shows 911 for the United States.
- Session updates. On your own request, “Help has started” and “Help is finished” record the visit. On someone else’s request, “They confirmed the help” records their confirmation.
