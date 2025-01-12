import type { FC, ReactNode } from "react";
import Slider from "@mui/material/Slider";
import cn from "classnames";
import type { EChartOption } from "echarts";
import Skeleton from "react-loading-skeleton";

import "react-loading-skeleton/dist/skeleton.css";
import { useState, useEffect } from "react";

import { Card } from "~/components/Cards/Card";
import { ChartSkeleton } from "~/components/ChartSkeleton";
import { ChartBase } from "~/components/Charts/ChartBase";
import { buildTimeSeriesOptions, normalizeTimestamp } from "~/utils";

function getSeriesDataState(series: EChartOption.Series[] | undefined) {
  return {
    isLoading: series
      ? series.some(({ data }) => data === undefined || data === null)
      : true,
    isEmpty: series ? series.some(({ data }) => data?.length === 0) : false,
  };
}

const getInitAxle = (initCoordinateAxle: number[]): number[] => {
  return initCoordinateAxle;
};

const getAxleRange = (
  allAxle: number[],
  initCoordinateAxle: number[]
): number[] => {
  return allAxle.slice(
    allAxle.indexOf(initCoordinateAxle[0] as number),
    allAxle.indexOf(initCoordinateAxle[1] as number) + 1
  );
};

const getDataRange = (
  allData: number[],
  allAxle: number[],
  initCoordinateAxle: number[]
): number[] => {
  return allData.slice(
    allAxle.indexOf(initCoordinateAxle[0] as number),
    allAxle.indexOf(initCoordinateAxle[1] as number) + 1
  );
};

// Helper function to find the closest index in allAxle for a given value
const findClosestItem = (arr: number[], target: number): number => {
  if (arr.indexOf(target) !== -1) return target;
  const closestIndex = arr.reduce(
    (closestIndex, currentValue, currentIndex) => {
      return Math.abs(currentValue - target) <
        Math.abs((arr[closestIndex] || 0) - target)
        ? currentIndex
        : closestIndex;
    },
    0
  );
  return arr[closestIndex]!;
};

export type ChartCardWithSliderProps = {
  title?: ReactNode;
  size?: "sm" | "md" | "lg";
  compact?: boolean;
  allData: number[];
  allAxle: number[];
  initCoordinateAxle: number[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  xAxisLabel?: (value: any) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  xAxisTooltip?: (value: any) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yAxisLabel?: (value: any) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yAxisTooltip?: (value: any) => unknown;

  minDistance: number;
  sliderStep?: number;
  showSlider?: boolean;
};

export const ChartCardWithSlider: FC<ChartCardWithSliderProps> = function ({
  title,
  size = "md",
  compact = false,
  allData,
  allAxle,
  initCoordinateAxle,

  xAxisLabel = (value) => normalizeTimestamp(value).format("HH:mm:ss"),
  xAxisTooltip = (value) => value,
  yAxisLabel = (value) => value,
  yAxisTooltip = (value) => value,

  minDistance,
  sliderStep = 1,
  showSlider = true,
}) {
  const [initAxle, setInitAxle] = useState<number[]>(
    getInitAxle(initCoordinateAxle)
  );
  const [axleRange, setAxleRange] = useState<number[]>(
    getAxleRange(allAxle, initCoordinateAxle)
  );
  const [dataRange, setDataRange] = useState<number[]>(
    getDataRange(allData, allAxle, initCoordinateAxle)
  );

  // Update states based on changes in props
  useEffect(() => {
    setInitAxle(getInitAxle(initCoordinateAxle));
  }, [initCoordinateAxle]);

  useEffect(() => {
    setAxleRange(getAxleRange(allAxle, initCoordinateAxle));
  }, [allAxle, initCoordinateAxle]);

  useEffect(() => {
    setDataRange(getDataRange(allData, allAxle, initCoordinateAxle));
  }, [allData, allAxle, initCoordinateAxle]);

  const handleRangeChange = (
    event: Event,
    newRange: number | number[],
    activeThumb: number
  ) => {
    if (!Array.isArray(newRange) || newRange.length < 2) {
      return;
    }

    let [startAxle = 0, endAxle = 0] = newRange;

    startAxle = findClosestItem(allAxle, startAxle);
    endAxle = findClosestItem(allAxle, endAxle);

    if ((endAxle as number) - (startAxle as number) < minDistance) {
      if (activeThumb === 0) {
        let start = Math.min(
          startAxle as number,
          (allAxle[allAxle.length - 1] as number) - minDistance
        );
        let end = start + minDistance;
        start = findClosestItem(allAxle, start);
        end = findClosestItem(allAxle, end);
        setInitAxle([start, end]);
        setAxleRange(
          allAxle.slice(allAxle.indexOf(start), allAxle.indexOf(end) + 1)
        );
        setDataRange(
          allData.slice(allAxle.indexOf(start), allAxle.indexOf(end) + 1)
        );
      } else {
        let end = Math.max(
          endAxle as number,
          (allAxle[0] as number) + minDistance
        );
        let start = end - minDistance;
        start = findClosestItem(allAxle, start);
        end = findClosestItem(allAxle, end);
        setInitAxle([start, end]);
        setAxleRange(
          allAxle.slice(allAxle.indexOf(start), allAxle.indexOf(end) + 1)
        );
        setDataRange(
          allData.slice(allAxle.indexOf(start), allAxle.indexOf(end) + 1)
        );
      }
    } else {
      setInitAxle([startAxle, endAxle]);
      setAxleRange(
        allAxle.slice(allAxle.indexOf(startAxle), allAxle.indexOf(endAxle) + 1)
      );
      setDataRange(
        allData.slice(allAxle.indexOf(startAxle), allAxle.indexOf(endAxle) + 1)
      );
    }
  };

  const options: EChartOption<
    EChartOption.SeriesBar | EChartOption.SeriesLine
  > = {
    ...buildTimeSeriesOptions({
      dates: axleRange.map((time) =>
        normalizeTimestamp(time).format("YYYY-MM-DD HH:mm:ss")
      ),
      axisFormatters: {
        xAxisLabel: xAxisLabel,
        xAxisTooltip: xAxisTooltip,
        yAxisLabel: yAxisLabel,
        yAxisTooltip: yAxisTooltip,
      },
    }),
    // Improper configuration may result in incomplete display of the x/y axis.
    // More Info: https://echarts.apache.org/en/option.html#title
    grid: { top: 27, right: 10, bottom: "20%", left: 100 },
    series: [
      {
        name: "Reward",
        data: dataRange,
        type: compact ? "line" : "bar",
        smooth: true,
      },
    ],
    toolbox: {
      show: true,
      feature: {
        magicType: { show: false },
        dataView: null,
        saveAsImage: null,
      },
    },
  };
  const { isEmpty, isLoading } = getSeriesDataState(options.series);

  return (
    <Card className="overflow-visible" compact>
      <div className="flex-start -mb-2 ml-2 flex font-semibold dark:text-warmGray-50">
        {title ?? <Skeleton width={150} />}
      </div>
      <div className="flex h-full flex-col gap-2">
        <div
          className={cn({
            "h-48 md:h-60 lg:h-56": size === "sm",
            "h-48 md:h-64 lg:h-80": size === "md",
            "lg:h-160 h-80 md:h-96": size === "lg",
          })}
        >
          {isEmpty ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-sm font-thin uppercase text-contentSecondary-light dark:text-contentSecondary-dark">
                No data
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <ChartSkeleton itemsCount={6} />
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center">
              <ChartBase options={options} />
              {showSlider ? (
                <Slider
                  value={initAxle}
                  onChange={handleRangeChange}
                  min={allAxle[0]}
                  max={allAxle[allAxle.length - 1]}
                  step={sliderStep}
                  shiftStep={sliderStep}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(index: number) =>
                    normalizeTimestamp(index).format("YYYY-MM-DD HH:mm:ss")
                  }
                  color="info"
                  disableSwap
                  marks
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
