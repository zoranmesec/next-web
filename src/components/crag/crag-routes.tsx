import { useRouter } from "next/router";
import { createContext, ReactNode, useEffect, useRef, useState } from "react";
import { gql, useQuery } from "urql";
import {
  Crag,
  MyCragSummaryDocument,
  Route,
  Sector,
} from "../../graphql/generated";
import { useAuth } from "../../utils/providers/auth-provider";
import { toggleQueryParam } from "../../utils/route-helpers";
import IconCheck from "../ui/icons/check";
import IconComment from "../ui/icons/comment";
import IconStarFull from "../ui/icons/star-full";
import CragRouteList from "./crag-routes/crag-route-list";
import CragSector from "./crag-routes/crag-sector";
import CragRoutesActions from "./crag-routes/crag-routes-actions";

interface Props {
  crag: Crag;
}

interface FilterOptions {
  routesTouches?: "ticked" | "tried" | "unticked" | "untried";
  difficulty?: { from: number; to: number };
  starRating?: {
    marvelous: boolean;
    beautiful: boolean;
    unremarkable: boolean;
  };
}

interface SortOptions {
  column: string;
  direction: "asc" | "desc";
}

interface SearchOptions {
  query?: string;
  focus?: boolean;
}

interface CragRoutesState {
  compact: boolean;
  combine: boolean;
  selectedColumns: string[];
  search?: SearchOptions;
  filter?: FilterOptions;
  sort?: SortOptions;
}

interface CragRouteListColumn {
  label: string;
  labelShort?: string;
  sortLabel?: string;
  sortAscLabel?: string;
  sortDescLabel?: string;
  excludeFromSort?: boolean;
  name: string;
  icon?: ReactNode;
  isOptional: boolean;
  isDefault: boolean;
  displayCondition?: () => boolean;
  width: number;
}

interface CragRoutesContextType {
  cragRoutesState: CragRoutesState;
  setCragRoutesState: (cragRoutesState: CragRoutesState) => void;
}

const CragRoutesContext = createContext<CragRoutesContextType>({
  cragRoutesState: {
    compact: true,
    combine: false,
    selectedColumns: [],
  },
  setCragRoutesState: () => {},
});

const cragRouteListColumns: CragRouteListColumn[] = [
  {
    name: "select",
    label: "#",
    sortLabel: "",
    sortAscLabel: "Od leve proti desni",
    sortDescLabel: "Od desne proti levi",
    isOptional: false,
    isDefault: true,
    width: 64,
  },
  {
    name: "sector",
    label: "Sektor",
    isOptional: false,
    displayCondition: () => false,
    isDefault: true,
    excludeFromSort: true,
    width: 100,
  },
  {
    name: "name",
    label: "Ime",
    sortLabel: "Po abecedi",
    sortAscLabel: "naraščajoče",
    sortDescLabel: "padajoče",
    isOptional: false,
    isDefault: true,
    width: 100,
  },
  {
    name: "difficulty",
    label: "Težavnost",
    sortLabel: "Po težavnosti",
    sortAscLabel: "naraščajoče",
    sortDescLabel: "padajoče",
    isOptional: true,
    isDefault: true,
    width: 130,
  },
  {
    name: "length",
    label: "Dolžina",
    sortLabel: "Po dolžini",
    sortAscLabel: "naraščajoče",
    sortDescLabel: "padajoče",
    isOptional: true,
    isDefault: true,
    width: 100,
  },
  {
    name: "nrTicks",
    label: "Št. uspešnih vzponov",
    labelShort: "Št. vzponov",
    sortLabel: "Po št. vzponov",
    sortAscLabel: "naraščajoče",
    sortDescLabel: "padajoče",
    isOptional: true,
    isDefault: false,
    width: 160,
  },
  {
    name: "nrTries",
    label: "Št. poskusov",
    sortLabel: "Po št. poskusov",
    sortAscLabel: "naraščajoče",
    sortDescLabel: "padajoče",
    isOptional: true,
    isDefault: false,
    width: 100,
  },
  {
    name: "nrClimbers",
    label: "Št. plezalcev",
    sortLabel: "Po št. plezalcev",
    sortAscLabel: "naraščajoče",
    sortDescLabel: "padajoče",
    isOptional: true,
    isDefault: false,
    width: 99,
  },
  {
    name: "starRating",
    label: "Lepota",
    sortLabel: "Po lepoti",
    sortAscLabel: "naraščajoče",
    sortDescLabel: "padajoče",
    icon: <IconStarFull />,
    isOptional: true,
    isDefault: true,
    width: 52,
  },
  {
    name: "comments",
    label: "Komentarji",
    sortLabel: "",
    sortAscLabel: "S komentarji najprej",
    sortDescLabel: "Brez komentarjev najprej",
    icon: <IconComment />,
    isOptional: true,
    isDefault: true,
    width: 52,
  },
  {
    name: "myAscents",
    label: "Moji vzponi",
    sortLabel: "",
    sortAscLabel: "Z mojimi vzponi najprej",
    sortDescLabel: "Brez mojih vzponov najprej",
    icon: <IconCheck />,
    isOptional: true,
    isDefault: true,
    width: 52,
  },
];

function CragRoutes({ crag }: Props) {
  const router = useRouter();

  const [cragRoutesState, setCragRoutesState] = useState<CragRoutesState>({
    compact: true,
    combine: false,
    selectedColumns: cragRouteListColumns
      .filter(({ isDefault }) => isDefault)
      .map(({ name }) => name),
  });

  const [compact, setCompact] = useState(true);
  const [breakpoint, setBreakpoint] = useState(500);

  // Load user's crag summary if logged in and after server-side render
  const [ascents, setAscents] = useState<Map<string, string>>(new Map());
  const authCtx = useAuth();
  const [fetchAscents, setFetchAscents] = useState(false);
  const [ascentsResult] = useQuery({
    query: MyCragSummaryDocument,
    variables: {
      input: {
        cragId: crag.id,
      },
    },
    pause: !fetchAscents,
  });

  useEffect(() => {
    if (authCtx.status?.loggedIn) {
      setFetchAscents(true);
    }
  }, [authCtx.status]);

  useEffect(() => {
    setAscents(
      new Map(
        ascentsResult.data?.myCragSummary.map((ascent) => [
          ascent.route.id,
          ascent.ascentType,
        ])
      )
    );
  }, [ascentsResult.data]);

  // Resize observer to detect when to switch to compact mode according to selected columns width
  useEffect(() => {
    setBreakpoint(
      cragRouteListColumns
        .filter((c) => cragRoutesState.selectedColumns.includes(c.name))
        .reduce((acc, c) => acc + c.width, 0)
    );
  }, [cragRoutesState.selectedColumns, cragRoutesState.selectedColumns.length]);

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setCompact((containerRef.current?.offsetWidth ?? 0) <= breakpoint);
    });
    resizeObserver.observe(document.body);
  });

  useEffect(() => {
    setCragRoutesState((state) => ({ ...state, compact }));
  }, [compact]);

  // Sectors collapse/expand
  // get initial state from query params (could be empty, string or array)
  const [expandedSectors, setExpandedSectors] = useState<number[]>(
    router.query.s
      ? typeof router.query.s == "string"
        ? [parseInt(router.query.s)]
        : router.query.s.map((s: string) => parseInt(s))
      : []
  );

  // toggle sector handler update state and silently push it to router
  const toggleSector = (index: number) => {
    setExpandedSectors((state) => {
      const i = state.indexOf(index);
      if (i === -1) {
        state.push(index);
      } else {
        state.splice(i, 1);
      }
      return state;
    });

    toggleQueryParam(
      router,
      "s",
      expandedSectors.map((s) => `${s}`),
      {
        scroll: false,
        shallow: true,
      }
    );
  };

  return (
    <div ref={containerRef}>
      <CragRoutesContext.Provider
        value={{ cragRoutesState, setCragRoutesState }}
      >
        <CragRoutesActions />

        <div className="mx-auto xs:px-8 2xl:container">
          {router.query.combine ||
          cragRoutesState.search?.query ||
          crag.sectors.length == 1 ? (
            <CragRouteList
              crag={crag}
              routes={crag.sectors.reduce(
                (acc: Route[], sector) => [...acc, ...sector.routes],
                []
              )}
              ascents={ascents}
            />
          ) : (
            // 'By sector' (uncombined) view
            crag.sectors.map((sector, index) => (
              <div
                key={sector.id}
                className={`${
                  index > 0
                    ? "border-t border-t-neutral-200"
                    : "overflow-hidden rounded-none xs:rounded-t-lg"
                } ${
                  index == crag.sectors.length - 1
                    ? "overflow-hidden rounded-none xs:rounded-b-lg"
                    : ""
                }`}
              >
                {/* <a id={`sektor-${index}`} /> */}
                <CragSector
                  crag={crag}
                  sector={sector as Sector}
                  ascents={ascents}
                  isOpen={expandedSectors.includes(index)}
                  onToggle={() => toggleSector(index)}
                />
              </div>
            ))
          )}
        </div>
      </CragRoutesContext.Provider>
    </div>
  );
}

gql`
  query MyCragSummary($input: FindActivityRoutesInput) {
    myCragSummary(input: $input) {
      ascentType
      route {
        id
        slug
      }
    }
  }
`;

export {
  cragRouteListColumns,
  CragRoutesContext,
  type FilterOptions,
  type SortOptions,
};
export default CragRoutes;
