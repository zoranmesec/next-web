import "../styles/globals.css";
import type { AppContext, AppProps } from "next/app";
import Head from "next/head";
import { dedupExchange, fetchExchange } from "urql";
import { withUrqlClient } from "next-urql";
import { AuthProvider } from "../utils/providers/auth-provider";
import App from "next/app";
import cookies from "next-cookies";
import { NextPageContext } from "next";

type MyAppProps = AppProps & { authToken: string };

function MyApp({ Component, pageProps, authToken }: MyAppProps) {
  return (
    <>
      <AuthProvider token={authToken}>
        <Head>
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon-16x16.png"
          />
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <meta name="apple-mobile-web-app-title" content="Plezanje.net" />
          <meta name="application-name" content="Plezanje.net" />
          <meta name="msapplication-TileColor" content="#ffc40d" />
          <meta name="msapplication-config" content="/browserconfig.xml" />
          <meta name="theme-color" content="#ffffff" />
        </Head>

        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}

export default withUrqlClient(
  (ssrExchange, ctx) => {
    const { token } = cookies(ctx ?? {});
    return {
      url: "https://plezanje.info/graphql",
      fetchOptions: {
        headers: {
          authorization: token ? `Bearer ${token}` : "",
        },
      },
      exchanges: [dedupExchange, ssrExchange, fetchExchange],
    };
  },
  { ssr: true }
)(MyApp);

MyApp.getInitialProps = async (context: AppContext | NextPageContext) => {
  if ("router" in context) {
    const appProps = await App.getInitialProps(context);
    const { token } = cookies(context.ctx);
    return { ...appProps, authToken: token ?? "" };
  }
};
