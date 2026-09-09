import Showroom from '../components/Showroom'
import { api } from '../lib/api'

export default function ShowroomPage() {
  async function handleBook(hat) {
    try {
      const { escrow } = await api.createEscrow({ hat_id: hat.id, talent_id: hat.user_id })
      if (confirm(`Escrow ₦${escrow.amount.toLocaleString()}. Fund now?`)) {
        await api.fundEscrow(escrow.id)
        alert('Escrow secured! Contacts unlocked.')
      }
    } catch (e) {
      alert(e.message)
    }
  }
  return <Showroom onBook={handleBook} />
}
