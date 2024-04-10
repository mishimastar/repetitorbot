import { once } from "node:events";

async function start() {
  // await StartMetrics();
  // Log.Info('Using ConfigMap:', CfgMap);
  // await InitNode();
  // await Promise.all([StartGRPC(), StartGRPCSchemas(), StartGRPCInternal(), StartGRPCMaintain()]);
  await Promise.race([once(process, "SIGINT"), once(process, "SIGTERM")]);

  // Notificator.stop();
  // await Promise.all([StopGRPC(), StopGRPCSchemas(), StopGRPCInternal(), StopGRPCMaintain()]);

  // if (!SS.amIMaster()) await SS.stopWatchingMaster();

  // await StopMetrics();
}

start().catch((error) => {
  console.error("tg shedule bot: fatal error", { error });
  process.exit(1);
});
