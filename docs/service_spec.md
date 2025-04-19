### 1. StorageService (MVP)
| Функция | Описание |
|---------|----------|
| `loadFacts(): Fact[]` | Чете масив `Fact` от localStorage или генерира нулирана версия. |
| `saveFacts(facts: Fact[])` | Сериализира и записва. |
| `logSession(session: Session)` | Пуш в масива `sessions`. |

### 2. Later: CloudSyncService
TODO: описва REST / Firebase синхронизация.
