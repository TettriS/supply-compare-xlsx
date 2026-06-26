import { useRef } from 'react'
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
    const boxNumberMap = {}
    const boxesList = listComplectionTable.rows.reduce<Record<string, string>[]>((boxAccumulator, complectionTableRow) => {
        const {
            'Короб': boxes,
            'Кол-во': count,
            'Баркод товара': barCode,
        } = complectionTableRow
        const boxMap = (boxes || '').replaceAll(/\s/gi, '').split(/[,\n\r]/gmi)

        boxMap.forEach((row) => {
            const matching = Array.from(row.matchAll(/(\d{0,})([кКмМmMKk])(\d{0,}[-]?\d{0,})/gmi), (i) => [...i])
            const [match, count1, rawType, count2] = matching
            const type = TYPE_DICTIONARY[String(rawType)]
            const result = {
                'Баркод товара': barCode,
                'Кол-во товаров': count,
                'ШК короба': '',
                'Срок годности': '',
                'test': `match: ${match}
                count1: ${count1}
                rawType: ${rawType}
                count2: ${count2}`.trim(),
            }

            switch(type) {
            case 1: {// Общий короб
                result['ШК короба'] = boxID.pop() || ''
                boxAccumulator.push(result)

                break;
            }
            case 2: // Моно короб (отдельный)
                result['ШК короба'] = boxID.pop() || ''
                boxAccumulator.push(result)

                break;
            default:
                break;
            }
        })

        return boxAccumulator;
    }, [])
    const compareTable: NormalizeResult = {
        headers: [...supplyTable.headers, 'test'],
        rows: boxesList,
    }
    
    exportNormalizeResultToXlsx(compareTable, 'filled-shk-excel')
}

function Parser() {
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
                    index: 8,
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
        <button type="button" onClick={handleOnDownload}>Download</button>
      </section>
    </>
  )
}

export default Parser
