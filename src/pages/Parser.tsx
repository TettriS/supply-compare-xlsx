import { useId, useRef } from 'react'
import FileSelect from '../components/FileSelect';
import parseAndNormalizeFile from '../utils/xlsx/parse';
import exportNormalizeResultToXlsx from '../utils/xlsx/export';
import type { ColumnRule, NormalizeResult } from '../utils/xlsx/types';

async function onFiles(files: FileList | null, expectedColumns: ColumnRule[], headerOffset: number) {
  if (!files || files.length === 0) return;
  const file = files[0];

  try {
    const res = await parseAndNormalizeFile(file, expectedColumns, undefined, headerOffset);
    console.log("headers:", res.headers);
    console.log("rows:", res.rows.slice(0, 10)); // первые 10 строк
    // Далее можно отправить res.rows в worker или продолжить обработку

    return res
  } catch (err) {
    console.error(err);
  }

  return null
}

const DEFAULT_TABLE: NormalizeResult = {
    headers: [],
    rows: [],
}

function compareTables(listComplectionTable: NormalizeResult, supplyTable: NormalizeResult) {
    const TYPE_DICTIONARY: Record<string, number | undefined> = {
        'к': 1,
        'К': 1,
        'K': 1,
        'k': 1,
        'м': 2,
        'М': 2,
        'm': 2,
        'M': 2,
    }
    const boxID = supplyTable.rows.map(({ 'ШК короба': boxID }) => (boxID))
    const boxNumberMap: Record<string, string | undefined> = {}
    const boxMonoMap: Record<string, string | undefined> = {}
    const boxesList = listComplectionTable.rows.reduce<Record<string, string>[]>((boxAccumulator, complectionTableRow) => {
        const {
            'Артикул': SKU,
            'Короб': boxes,
            'Кол-во': count,
            'Баркод товара': barCode,
        } = complectionTableRow
        const boxMap = (boxes || '').replaceAll(/\s/gi, '').split(/[,\n\r]/gmi)

        boxMap.forEach((row) => {
            if(row === 'Короб') { return }

            const [matching] = Array.from(row.matchAll(/(\d{0,})([КкKkМмMm])(\d{0,}(?:[-]\d{1,})?)/gmi), (i) => [...i])
            const [match, count1, rawType, count2] = matching || []
            const type = TYPE_DICTIONARY[String(rawType)]
            const result = {
                'Баркод товара': barCode,
                'Кол-во товаров': count,
                'ШК короба': '',
                'Срок годности': '',
                'test': String(`кол-во:${count
                    } подстрока: ${row
                    } найдено: ${match
                    } ${type === 1 ? 'шт' : ''}: ${count1
                    } rawType: ${rawType
                    } короб: ${count2
                }`),
            }

            switch(type) {
            case 1: {// Общий короб
                const [from, to] = count2.split('-')

                if (to) {// Диапазон коробов
                    for(let i = +from; i <= +to; i++) {
                        const newId = boxNumberMap[i] || boxID.pop()

                        boxNumberMap[i] = newId

                        result['ШК короба'] = newId || ''
                        result['Кол-во товаров'] = count1

                        boxAccumulator.push({ ...result })
                    }
                } else {// Один короб
                    const id = boxNumberMap[from] || boxID.pop()

                    boxNumberMap[from] = id

                    result['ШК короба'] = id || ''
                    result['Кол-во товаров'] = count1 || count

                    boxAccumulator.push({ ...result })
                }

                break;
            }
            case 2: // Моно короб (отдельный)
                result['Кол-во товаров'] = count1 || count

                if(count2) {
                    for(let i = 0; i < +count2; i++) {
                        result['ШК короба'] = boxID.pop() || ''
                        boxAccumulator.push({ ...result })

                        boxMonoMap[result['ШК короба']] = `${SKU} - ${result['Кол-во товаров']}`
                    }
                } else {
                    result['ШК короба'] = boxID.pop() || ''
                    boxAccumulator.push({ ...result })

                    boxMonoMap[result['ШК короба']] = `${SKU} - ${result['Кол-во товаров']}`
                }

                break;
            default:
                break;
            }
        })

        return boxAccumulator;
    }, [])
    const compareTable: NormalizeResult = {
        headers: [...supplyTable.headers, 'Тип', 'test'],
        rows: boxesList,
    }

    console.log(compareTable)

    const box1  = Object.entries(boxNumberMap).map(([key, value]) => ({
        'ШК': String(value),
        'Тип': 'ОБЩ',
        'Номер/Артикул': String(key)
    }))
    const box2  = Object.entries(boxMonoMap).map(([key, value]) => ({
        'ШК': String(key),
        'Тип': 'ОТД',
        'Номер/Артикул': String(value)
    }))

    const boxList: NormalizeResult = {
        headers: ['ШК', 'Тип', 'Номер/Артикул'],
        rows: [...box1, ...box2],
    }
    
    exportNormalizeResultToXlsx([compareTable, boxList], 'filled-shk-excel', ['Sheet1', 'Sheet2'])
}

function Parser() {
    const id = useId()
    const supplyTable = useRef<NormalizeResult>(DEFAULT_TABLE)
    const listComplectionTable = useRef<NormalizeResult>(DEFAULT_TABLE)

    async function handleOnFile(files: FileList | null) {
        supplyTable.current = await onFiles(
            files,
            [
                {
                    key: 'Баркод товара',
                    name: 'Баркод товара',
                    index: 0,
                },
                {
                    key: 'Кол-во товаров',
                    name: 'Кол-во товаров',
                    index: 1,
                },
                {
                    key: 'ШК короба',
                    name: 'ШК короба',
                    index: 2,
                },
                {
                    key: 'Срок годности',
                    name: 'Срок годности',
                    index: 3,
                },
            ],
            0,
        ) || DEFAULT_TABLE
    }

    async function handleOnFile2(files: FileList | null) {
        listComplectionTable.current = await onFiles(
            files,
            [
                {
                    key: 'Артикул',
                    name: 'Артикул',
                    index: 0,
                },
                {
                    key: 'Кол-во',
                    name: 'Кол-во',
                    index: 2,
                },
                {
                    key: 'Короб',
                    name: 'Короб',
                    index: 5,
                },
                {
                    key: 'Баркод товара',
                    name: 'Баркод товара',
                    index: 13,
                },
            ],
            4
        ) || DEFAULT_TABLE
    }

    function handleOnDownload() {
        compareTables(listComplectionTable.current, supplyTable.current)
    }

  return (
    <>
      <section id="center" style={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
      }}>
        <FileSelect
            label='Номера коробов'
            onFiles={handleOnFile}
        />
        <FileSelect
            label='Сборочный лист'
            onFiles={handleOnFile2}
        />
      </section>
      <section>
        <button
            id={id}
            style={{
                position: "absolute",
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: "hidden",
                clip: "rect(0, 0, 0, 0)",
                whiteSpace: "nowrap",
                border: 0,
            }}
            type="button" onClick={handleOnDownload}
        >
            Download
        </button>

        <label
            htmlFor={id}
            style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 14px",
            border: "1px solid #ccc",
            borderRadius: 8,
            cursor: "pointer",
            background: "#fff",
            width: "fit-content",
            }}
        >
            Download
        </label>
      </section>
    </>
  )
}

export default Parser
